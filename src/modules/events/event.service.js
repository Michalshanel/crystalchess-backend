/**
 * Event Service
 * Business logic for event operations
 */

const { prisma } = require("../../config/database");
const DateUtil = require("../../utils/date.util");
const FileUtil = require("../../utils/file.util");
const { EVENT_STATUS, DEFAULT_PAGE_SIZE } = require("../../config/constants");

class EventService {
  /**
   * Create new event
   * @param {number} organizerId - Organizer user ID
   * @param {object} eventData - Event data
   * @returns {Promise<object>} Created event
   */
  async createEvent(organizerId, eventData) {
    const {
      eventName,
      description,
      eventDates,
      eventStartTime,
      eventEndTime,
      location,
      venueAddress,
      googleMapLink,
      entryFee,
      prize,
      maxCapacity,
      rulesText,
      eventType,
      isOnline,
      categories,
      govtConcessionType,
      govtConcessionValue,
    } = eventData;

    // Convert event dates array to JSON string
    const eventDatesJson = JSON.stringify(eventDates);

    // Create event
    const event = await prisma.event.create({
      data: {
        organizerId,
        eventName,
        description: description || null,
        eventDates: eventDatesJson,
        eventStartTime: `1970-01-01T${eventStartTime}:00.000Z`,
        eventEndTime: eventEndTime
          ? `1970-01-01T${eventEndTime}:00.000Z`
          : null,
        location,
        venueAddress: venueAddress || null,
        googleMapLink: googleMapLink || null,
        entryFee,
        prize: prize || null,
        maxCapacity: maxCapacity || null,
        rulesText: rulesText || null,
        eventType: eventType || null,
        eventStatus: EVENT_STATUS.UPCOMING,
        isOnline: isOnline || false,
        isFeatured: false,
        govtConcessionType: govtConcessionType || null,
        govtConcessionValue: govtConcessionValue || null,
      },
    });

    // Add event categories if provided
    if (categories && categories.length > 0) {
      await prisma.eventCategoryMapping.createMany({
        data: categories.map((categoryId) => ({
          eventId: event.eventId,
          categoryId,
        })),
      });
    }

    return this.formatEventResponse(event);
  }

  /**
   * Get event by ID
   * @param {number} eventId - Event ID
   * @returns {Promise<object>} Event details
   */
  async getEventById(eventId) {
    const event = await prisma.event.findUnique({
      where: { eventId },
      include: {
        organizer: {
          select: {
            userId: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
        categories: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!event) {
      throw new Error("Event not found");
    }

    return this.formatEventResponse(event);
  }

  /**
   * Get all events with filters and pagination
   * @param {object} filters - Query filters
   * @returns {Promise<object>} Paginated events list
   */
  async getEvents(filters = {}) {
    const {
      page = 1,
      limit = DEFAULT_PAGE_SIZE,
      eventStatus,
      eventType,
      search,
      isFeatured,
      isOnline,
    } = filters;

    // Build where clause
    const where = {};

    if (eventStatus) where.eventStatus = eventStatus;
    if (eventType) where.eventType = eventType;
    if (isFeatured !== undefined) where.isFeatured = isFeatured;
    if (isOnline !== undefined) where.isOnline = isOnline;

    if (search) {
      where.OR = [
        { eventName: { contains: search } },
        { location: { contains: search } },
        { description: { contains: search } },
      ];
    }

    // Get total count
    const total = await prisma.event.count({ where });

    // Get paginated events
    const events = await prisma.event.findMany({
      where,
      include: {
        organizer: {
          select: {
            userId: true,
            fullName: true,
            email: true,
          },
        },
        categories: {
          include: {
            category: true,
          },
        },
      },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      events: events.map((event) => this.formatEventResponse(event)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get organizer's events
   * @param {number} organizerId - Organizer user ID
   * @param {object} filters - Query filters
   * @returns {Promise<object>} Organizer's events
   */
  async getOrganizerEvents(organizerId, filters = {}) {
    const { page = 1, limit = DEFAULT_PAGE_SIZE, eventStatus, search } = filters;

    const where = { organizerId };
    if (eventStatus) where.eventStatus = eventStatus;

    // Add search filter
    if (search) {
      where.OR = [
        { eventName: { contains: search } },
        { location: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const total = await prisma.event.count({ where });

    const events = await prisma.event.findMany({
      where,
      include: {
        categories: {
          include: {
            category: true,
          },
        },
        _count: {
          select: {
            bookings: {
              where: {
                bookingStatus: "CONFIRMED",
                paymentStatus: "PAID",
              },
            },
          },
        },
        bookings: {
          where: {
            bookingStatus: "CONFIRMED",
            paymentStatus: "PAID",
          },
          select: {
            amountPaid: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Format events and add confirmed bookings count and revenue
    const formattedEvents = events.map((event) => {
      const formatted = this.formatEventResponse(event);
      formatted.confirmedBookings = event._count?.bookings || 0;
      // Calculate actual confirmed revenue from amountPaid
      formatted.confirmedRevenue = (event.bookings || []).reduce(
        (sum, b) => sum + Number(b.amountPaid || 0),
        0
      );
      // Remove bookings array from response (we only needed it for calculation)
      delete formatted.bookings;
      return formatted;
    });

    return {
      events: formattedEvents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update event
   * @param {number} eventId - Event ID
   * @param {number} organizerId - Organizer user ID
   * @param {object} updateData - Data to update
   * @returns {Promise<object>} Updated event
   */
  async updateEvent(eventId, organizerId, updateData) {
    // Check if event exists and belongs to organizer
    const existingEvent = await prisma.event.findFirst({
      where: {
        eventId,
        organizerId,
      },
    });

    if (!existingEvent) {
      throw new Error(
        "Event not found or you do not have permission to update it"
      );
    }

    // Build update object
    const dataToUpdate = {};

    if (updateData.eventName) dataToUpdate.eventName = updateData.eventName;
    if (updateData.description !== undefined)
      dataToUpdate.description = updateData.description || null;
    if (updateData.eventDates)
      dataToUpdate.eventDates = JSON.stringify(updateData.eventDates);
    if (updateData.eventStartTime) {
      // Handle both "HH:mm" format and full ISO format
      const startTime = updateData.eventStartTime;
      if (startTime.includes('T')) {
        dataToUpdate.eventStartTime = startTime;
      } else {
        dataToUpdate.eventStartTime = `1970-01-01T${startTime}:00.000Z`;
      }
    }
    if (updateData.eventEndTime !== undefined) {
      if (!updateData.eventEndTime) {
        dataToUpdate.eventEndTime = null;
      } else {
        // Handle both "HH:mm" format and full ISO format
        const endTime = updateData.eventEndTime;
        if (endTime.includes('T')) {
          dataToUpdate.eventEndTime = endTime;
        } else {
          dataToUpdate.eventEndTime = `1970-01-01T${endTime}:00.000Z`;
        }
      }
    }
    if (updateData.location) dataToUpdate.location = updateData.location;
    if (updateData.venueAddress !== undefined)
      dataToUpdate.venueAddress = updateData.venueAddress || null;
    if (updateData.googleMapLink !== undefined)
      dataToUpdate.googleMapLink = updateData.googleMapLink || null;
    if (updateData.entryFee !== undefined)
      dataToUpdate.entryFee = updateData.entryFee;
    if (updateData.prize !== undefined)
      dataToUpdate.prize = updateData.prize || null;
    if (updateData.maxCapacity !== undefined)
      dataToUpdate.maxCapacity = updateData.maxCapacity;
    if (updateData.rulesText !== undefined)
      dataToUpdate.rulesText = updateData.rulesText || null;
    if (updateData.eventType !== undefined)
      dataToUpdate.eventType = updateData.eventType;
    if (updateData.eventStatus)
      dataToUpdate.eventStatus = updateData.eventStatus;
    if (updateData.isOnline !== undefined)
      dataToUpdate.isOnline = updateData.isOnline;
    if (updateData.govtConcessionType !== undefined)
      dataToUpdate.govtConcessionType = updateData.govtConcessionType || null;
    if (updateData.govtConcessionValue !== undefined)
      dataToUpdate.govtConcessionValue = updateData.govtConcessionValue || null;

    // Update event
    const event = await prisma.event.update({
      where: { eventId },
      data: dataToUpdate,
      include: {
        categories: {
          include: {
            category: true,
          },
        },
      },
    });

    // Update categories if provided
    if (updateData.categories) {
      // Delete existing mappings
      await prisma.eventCategoryMapping.deleteMany({
        where: { eventId },
      });

      // Create new mappings
      if (updateData.categories.length > 0) {
        await prisma.eventCategoryMapping.createMany({
          data: updateData.categories.map((categoryId) => ({
            eventId,
            categoryId,
          })),
        });
      }
    }

    return this.formatEventResponse(event);
  }

  /**
   * Upload event image
   * @param {number} eventId - Event ID
   * @param {number} organizerId - Organizer user ID
   * @param {string} filePath - Uploaded file path
   * @returns {Promise<object>} Updated event
   */
  async uploadEventImage(eventId, organizerId, filePath) {
    // Check if event exists and belongs to organizer
    const event = await prisma.event.findFirst({
      where: {
        eventId,
        organizerId,
      },
    });

    if (!event) {
      throw new Error(
        "Event not found or you do not have permission to update it"
      );
    }

    // Delete old image if exists
    if (event.eventImage) {
      FileUtil.deleteFile(event.eventImage);
    }

    // Update event with new image
    const updatedEvent = await prisma.event.update({
      where: { eventId },
      data: { eventImage: filePath },
    });

    return this.formatEventResponse(updatedEvent);
  }

  /**
   * Upload rules PDF
   * @param {number} eventId - Event ID
   * @param {number} organizerId - Organizer user ID
   * @param {string} filePath - Uploaded file path
   * @returns {Promise<object>} Updated event
   */
  async uploadRulesPdf(eventId, organizerId, filePath) {
    const event = await prisma.event.findFirst({
      where: { eventId, organizerId },
    });

    if (!event) {
      throw new Error("Event not found or you do not have permission");
    }

    if (event.rulesPdf) {
      FileUtil.deleteFile(event.rulesPdf);
    }

    const updatedEvent = await prisma.event.update({
      where: { eventId },
      data: { rulesPdf: filePath },
    });

    return this.formatEventResponse(updatedEvent);
  }

  /**
   * Create event edit request (organizers cannot delete events)
   * @param {number} eventId - Event ID
   * @param {number} organizerId - Organizer user ID
   * @param {string} message - Request message
   * @returns {Promise<object>} Edit request
   */
  async createEditRequest(eventId, organizerId, message) {
    // Check if event exists and belongs to organizer
    const event = await prisma.event.findFirst({
      where: { eventId, organizerId },
    });

    if (!event) {
      throw new Error("Event not found or you do not have permission");
    }

    // Check if there's already a pending request
    const existingRequest = await prisma.eventEditRequest.findFirst({
      where: {
        eventId,
        organizerId,
        status: "PENDING",
      },
    });

    if (existingRequest) {
      throw new Error("You already have a pending edit request for this event");
    }

    // Create edit request
    const request = await prisma.eventEditRequest.create({
      data: {
        eventId,
        organizerId,
        message,
        status: "PENDING",
      },
      include: {
        event: {
          select: {
            eventName: true,
            eventStatus: true,
          },
        },
      },
    });

    return request;
  }

  /**
   * Get organizer's edit requests
   * @param {number} organizerId - Organizer user ID
   * @returns {Promise<array>} Edit requests
   */
  async getOrganizerEditRequests(organizerId) {
    const requests = await prisma.eventEditRequest.findMany({
      where: { organizerId },
      include: {
        event: {
          select: {
            eventId: true,
            eventName: true,
            eventStatus: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return requests;
  }

  /**
   * Get featured events for homepage
   * @param {number} limit - Number of featured events
   * @returns {Promise<array>} Featured events
   */
  async getFeaturedEvents(limit = 5) {
    const events = await prisma.event.findMany({
      where: {
        isFeatured: true,
        eventStatus: EVENT_STATUS.UPCOMING,
      },
      include: {
        organizer: {
          select: {
            userId: true,
            fullName: true,
          },
        },
        categories: {
          include: {
            category: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return events.map((event) => this.formatEventResponse(event));
  }

  /**
   * Get organizer statistics
   * @param {number} organizerId - Organizer user ID
   * @returns {Promise<object>} Organizer statistics
   */
  async getOrganizerStatistics(organizerId) {
    // Get all events for this organizer
    const events = await prisma.event.findMany({
      where: { organizerId },
      select: {
        eventId: true,
        eventStatus: true,
        entryFee: true,
      },
    });

    const eventIds = events.map((e) => e.eventId);

    // Get confirmed bookings for organizer's events
    const confirmedBookings = await prisma.booking.findMany({
      where: {
        eventId: { in: eventIds },
        bookingStatus: "CONFIRMED",
        paymentStatus: "PAID",
      },
      select: {
        amountPaid: true,
        eventId: true,
      },
    });

    // Calculate statistics
    const totalEvents = events.length;
    const activeEvents = events.filter(
      (e) => e.eventStatus === "UPCOMING" || e.eventStatus === "IN_PROGRESS"
    ).length;
    const completedEvents = events.filter(
      (e) => e.eventStatus === "COMPLETED"
    ).length;

    // Total confirmed bookings count
    const totalConfirmedBookings = confirmedBookings.length;

    // Total revenue from confirmed & paid bookings
    const totalRevenue = confirmedBookings.reduce(
      (sum, b) => sum + Number(b.amountPaid || 0),
      0
    );

    return {
      totalEvents,
      activeEvents,
      completedEvents,
      totalConfirmedBookings,
      totalRevenue,
    };
  }

  /**
   * Get all event categories
   * @returns {Promise<Array>} List of categories
   */
  async getCategories() {
    const categories = await prisma.eventCategory.findMany({
      where: { isActive: true },
      orderBy: { ageLimit: "asc" },
    });
    return categories;
  }

  /**
   * Get event participants (bookings)
   * @param {number} eventId - Event ID
   * @param {number} organizerId - Organizer user ID (for verification)
   * @param {object} filters - Query filters
   * @returns {Promise<object>} Participants list
   */
  async getEventParticipants(eventId, organizerId, filters = {}) {
    // Verify organizer owns this event
    const event = await prisma.event.findFirst({
      where: { eventId, organizerId },
    });

    if (!event) {
      throw new Error("Event not found or you do not have permission");
    }

    const { bookingStatus, paymentStatus, search } = filters;

    // Build booking filter
    const bookingWhere = { eventId };
    if (bookingStatus) bookingWhere.bookingStatus = bookingStatus;
    if (paymentStatus) bookingWhere.paymentStatus = paymentStatus;

    // Get bookings with participants
    const bookings = await prisma.booking.findMany({
      where: bookingWhere,
      include: {
        user: {
          select: {
            userId: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
        participants: {
          include: {
            participant: {
              select: {
                participantId: true,
                fullName: true,
                dateOfBirth: true,
                gender: true,
                contactNumber: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { bookingDate: "desc" },
    });

    // Flatten to participant level for easier display
    const participants = [];
    for (const booking of bookings) {
      for (const bp of booking.participants) {
        const participant = {
          bookingId: booking.bookingId,
          bookingReference: booking.bookingReference,
          bookingStatus: booking.bookingStatus,
          paymentStatus: booking.paymentStatus,
          amountPaid: booking.amountPaid,
          bookingDate: booking.bookingDate,
          participantId: bp.participant.participantId,
          fullName: bp.participant.fullName,
          dateOfBirth: bp.participant.dateOfBirth,
          gender: bp.participant.gender,
          contactNumber: bp.participant.contactNumber,
          email: bp.participant.email || booking.user?.email,
          bookedBy: booking.user?.fullName,
          bookedByEmail: booking.user?.email,
        };

        // Apply search filter if provided
        if (search) {
          const searchLower = search.toLowerCase();
          if (
            !participant.fullName?.toLowerCase().includes(searchLower) &&
            !participant.email?.toLowerCase().includes(searchLower) &&
            !participant.bookingReference?.toLowerCase().includes(searchLower)
          ) {
            continue;
          }
        }

        participants.push(participant);
      }
    }

    return {
      eventId,
      eventName: event.eventName,
      totalParticipants: participants.length,
      participants,
    };
  }

  /**
   * Format event response
   * @param {object} event - Event object from database
   * @returns {object} Formatted event
   */
  formatEventResponse(event) {
    const formatted = {
      ...event,
      eventDates: DateUtil.parseEventDates(event.eventDates),
      eventStartTime: DateUtil.formatTime(event.eventStartTime),
      eventEndTime: event.eventEndTime
        ? DateUtil.formatTime(event.eventEndTime)
        : null,
      availableSlots: event.maxCapacity
        ? event.maxCapacity - event.currentBookings
        : null,
    };

    // Format image URLs
    if (event.eventImage) {
      formatted.eventImageUrl = FileUtil.getFileUrl(event.eventImage);
    }
    if (event.rulesPdf) {
      formatted.rulesPdfUrl = FileUtil.getFileUrl(event.rulesPdf);
    }

    // Format categories
    if (event.categories) {
      formatted.categories = event.categories.map(
        (mapping) => mapping.category
      );
    }

    return formatted;
  }
}

module.exports = new EventService();
