/**
 * Booking Service
 * Business logic for booking operations
 */

const { prisma } = require("../../config/database");
const DateUtil = require("../../utils/date.util");
const config = require("../../config/environment");
const {
  BOOKING_STATUS,
  PAYMENT_STATUS,
  GENDER,
  DEFAULT_PAGE_SIZE,
  BOOKING_REFERENCE_PREFIX,
  MESSAGES,
} = require("../../config/constants");

class BookingService {
  /**
   * Generate unique booking reference
   * Format: CC-YYYYMMDD-XXXX (e.g., CC-20250615-1234)
   */
  async generateBookingReference() {
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0].replace(/-/g, "");
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `${BOOKING_REFERENCE_PREFIX}-${dateStr}-${randomNum}`;
  }

  /**
   * Calculate booking amount with platform fee and government student concession
   * @param {number} entryFee - Event entry fee per participant
   * @param {array} participantDetails - Array of participant objects with isGovtStudent flag
   * @param {boolean} isOnline - Whether event is online
   * @param {string} govtConcessionType - Type of concession (RUPEES or PERCENTAGE)
   * @param {number} govtConcessionValue - Value of concession
   * @returns {object} Amount breakdown
   */
  calculateBookingAmount(entryFee, participantDetails, isOnline, govtConcessionType, govtConcessionValue) {
    const fee = Number(entryFee);
    let totalEventFee = 0;
    let totalConcession = 0;
    let govtStudentCount = 0;

    // Calculate fees for each participant
    for (const participant of participantDetails) {
      let participantFee = fee;

      // Apply government student concession if applicable
      if (participant.isGovtStudent && govtConcessionType && govtConcessionValue) {
        govtStudentCount++;
        if (govtConcessionType === "RUPEES") {
          // Fixed rupees discount
          participantFee = Math.max(0, fee - Number(govtConcessionValue));
          totalConcession += Number(govtConcessionValue);
        } else if (govtConcessionType === "PERCENTAGE") {
          // Percentage discount
          const discount = (fee * Number(govtConcessionValue)) / 100;
          participantFee = Math.max(0, fee - discount);
          totalConcession += discount;
        }
      }

      totalEventFee += participantFee;
    }

    // Add platform fee only for offline events (₹10 per participant)
    const platformFeePerParticipant = config.fees?.offlinePlatformFee || 10;
    const platformFee = isOnline ? 0 : platformFeePerParticipant * participantDetails.length;

    const totalAmount = totalEventFee + platformFee;

    return {
      eventFee: totalEventFee,
      platformFee,
      totalAmount,
      concessionApplied: totalConcession,
      govtStudentCount,
      participantCount: participantDetails.length,
    };
  }

  /**
   * Validate participant eligibility for category
   * @param {object} participant - Participant object
   * @param {object} category - Category object
   * @returns {object} Validation result
   */
  validateParticipantForCategory(participant, category) {
    const age = DateUtil.calculateAge(participant.dateOfBirth);

    // Check age limit if category has one
    if (category.ageLimit && age > category.ageLimit) {
      return {
        isValid: false,
        message: `${participant.fullName} is ${age} years old, which exceeds the age limit of ${category.ageLimit} for ${category.categoryName}`,
      };
    }

    // Note: Gender restrictions removed as EventCategory doesn't have a gender field
    // This can be added back if the schema is updated to include gender in categories

    return { isValid: true };
  }

  /**
   * Create new booking
   * @param {number} userId - User ID
   * @param {object} bookingData - Booking data
   * @returns {Promise<object>} Created booking
   */
  async createBooking(userId, bookingData) {
    const { eventId, participants } = bookingData;

    // Get event details
    const event = await prisma.event.findUnique({
      where: { eventId },
      include: {
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

    // Check if event is upcoming
    if (event.eventStatus !== "UPCOMING") {
      throw new Error("Bookings are only available for upcoming events");
    }

    // Check if slots are available
    if (event.maxCapacity) {
      const availableSlots = event.maxCapacity - event.currentBookings;
      if (availableSlots < participants.length) {
        throw new Error(MESSAGES.INSUFFICIENT_SLOTS);
      }
    }

    // Validate all participants and categories, collect participant details
    const participantDetails = [];
    for (const participantData of participants) {
      // Get participant details
      const participant = await prisma.participant.findFirst({
        where: {
          participantId: participantData.participantId,
          userId, // Ensure participant belongs to user
        },
      });

      if (!participant) {
        throw new Error(
          `Participant with ID ${participantData.participantId} not found`
        );
      }

      // Store participant details for price calculation
      participantDetails.push({
        participantId: participant.participantId,
        isGovtStudent: participant.isGovtStudent || false,
      });

      // Category validation is optional - only validate if categoryCode is provided
      if (participantData.categoryCode && event.categories?.length > 0) {
        // Find category
        const categoryMapping = event.categories.find(
          (cat) => cat.category.categoryCode === participantData.categoryCode
        );

        if (!categoryMapping) {
          throw new Error(
            `Category ${participantData.categoryCode} not available for this event`
          );
        }

        // Validate participant for category
        const validation = this.validateParticipantForCategory(
          participant,
          categoryMapping.category
        );

        if (!validation.isValid) {
          throw new Error(validation.message);
        }
      }
    }

    // Calculate booking amount with government student concession
    const amounts = this.calculateBookingAmount(
      event.entryFee,
      participantDetails,
      event.isOnline,
      event.govtConcessionType,
      event.govtConcessionValue
    );

    // Generate booking reference
    const bookingReference = await this.generateBookingReference();

    // Create booking in transaction
    const booking = await prisma.$transaction(async (tx) => {
      // Create booking
      const newBooking = await tx.booking.create({
        data: {
          eventId,
          userId,
          bookingReference,
          bookingStatus: BOOKING_STATUS.PENDING,
          paymentStatus: PAYMENT_STATUS.PENDING,
          amountPaid: amounts.totalAmount,
        },
      });

      // Create booking participants
      await tx.bookingParticipant.createMany({
        data: participants.map((p) => ({
          bookingId: newBooking.bookingId,
          participantId: p.participantId,
          eventId,
        })),
      });

      // Update event current bookings count
      await tx.event.update({
        where: { eventId },
        data: {
          currentBookings: {
            increment: participants.length,
          },
        },
      });

      return newBooking;
    });

    // Get full booking details
    return this.getBookingById(booking.bookingId, userId);
  }

  /**
   * Get booking by ID
   * @param {number} bookingId - Booking ID
   * @param {number} userId - User ID (for ownership check)
   * @returns {Promise<object>} Booking details
   */
  async getBookingById(bookingId, userId) {
    const booking = await prisma.booking.findFirst({
      where: {
        bookingId,
        userId,
      },
      include: {
        event: {
          select: {
            eventId: true,
            eventName: true,
            eventDates: true,
            eventStartTime: true,
            eventEndTime: true,
            location: true,
            venueAddress: true,
            entryFee: true,
            eventStatus: true,
            isOnline: true,
            eventImage: true,
            govtConcessionType: true,
            govtConcessionValue: true,
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
                isGovtStudent: true,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      throw new Error("Booking not found");
    }

    return this.formatBookingResponse(booking);
  }

  /**
   * Get user's bookings
   * @param {number} userId - User ID
   * @param {object} filters - Query filters
   * @returns {Promise<object>} Paginated bookings
   */
  async getUserBookings(userId, filters = {}) {
    const {
      page = 1,
      limit = DEFAULT_PAGE_SIZE,
      bookingStatus,
      paymentStatus,
      eventId,
    } = filters;

    const where = { userId };
    if (bookingStatus) where.bookingStatus = bookingStatus;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (eventId) where.eventId = parseInt(eventId);

    const total = await prisma.booking.count({ where });

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        event: {
          select: {
            eventId: true,
            eventName: true,
            eventDates: true,
            eventStartTime: true,
            location: true,
            eventStatus: true,
            isOnline: true,
          },
        },
        participants: {
          include: {
            participant: {
              select: {
                participantId: true,
                fullName: true,
                gender: true,
              },
            },
          },
        },
      },
      orderBy: { bookingDate: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      bookings: bookings.map((booking) => this.formatBookingResponse(booking)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Cancel booking
   * @param {number} bookingId - Booking ID
   * @param {number} userId - User ID
   * @param {string} reason - Cancellation reason
   * @returns {Promise<object>} Updated booking
   */
  async cancelBooking(bookingId, userId, reason) {
    // Get booking
    const booking = await prisma.booking.findFirst({
      where: {
        bookingId,
        userId,
      },
      include: {
        event: true,
        participants: true,
      },
    });

    if (!booking) {
      throw new Error("Booking not found");
    }

    // Check if booking can be cancelled
    if (booking.bookingStatus === BOOKING_STATUS.CANCELLED) {
      throw new Error("Booking is already cancelled");
    }

    if (booking.bookingStatus === BOOKING_STATUS.COMPLETED) {
      throw new Error("Cannot cancel completed booking");
    }

    // Update booking in transaction
    const updatedBooking = await prisma.$transaction(async (tx) => {
      // Update booking status
      const updated = await tx.booking.update({
        where: { bookingId },
        data: {
          bookingStatus: BOOKING_STATUS.CANCELLED,
        },
      });

      // Decrease event current bookings
      await tx.event.update({
        where: { eventId: booking.eventId },
        data: {
          currentBookings: {
            decrement: booking.participants.length,
          },
        },
      });

      // If payment was made, mark for refund
      if (booking.paymentStatus === PAYMENT_STATUS.PAID) {
        await tx.booking.update({
          where: { bookingId },
          data: {
            paymentStatus: PAYMENT_STATUS.REFUNDED,
          },
        });
      }

      return updated;
    });

    return this.getBookingById(bookingId, userId);
  }

  /**
   * Confirm booking payment (demo/simulation)
   * @param {number} bookingId - Booking ID
   * @param {number} userId - User ID
   * @param {string} paymentMethod - Payment method used
   * @returns {Promise<object>} Updated booking
   */
  async confirmPayment(bookingId, userId, paymentMethod = "online") {
    // Get booking
    const booking = await prisma.booking.findFirst({
      where: {
        bookingId,
        userId,
      },
    });

    if (!booking) {
      throw new Error("Booking not found");
    }

    // Check if booking can be confirmed
    if (booking.bookingStatus === BOOKING_STATUS.CANCELLED) {
      throw new Error("Cannot confirm payment for cancelled booking");
    }

    if (booking.paymentStatus === PAYMENT_STATUS.PAID) {
      throw new Error("Payment already completed");
    }

    // Update booking status
    await prisma.booking.update({
      where: { bookingId },
      data: {
        bookingStatus: BOOKING_STATUS.CONFIRMED,
        paymentStatus: PAYMENT_STATUS.PAID,
      },
    });

    return this.getBookingById(bookingId, userId);
  }

  /**
   * Format booking response
   * @param {object} booking - Booking object from database
   * @returns {object} Formatted booking
   */
  formatBookingResponse(booking) {
    const formatted = {
      ...booking,
      eventDates: booking.event
        ? DateUtil.parseEventDates(booking.event.eventDates)
        : [],
      eventStartTime: booking.event
        ? DateUtil.formatTime(booking.event.eventStartTime)
        : null,
    };

    // Format participants
    if (booking.participants) {
      formatted.participants = booking.participants.map((bp) => ({
        bookingParticipantId: bp.id,
        participantId: bp.participant.participantId,
        fullName: bp.participant.fullName,
        dateOfBirth: bp.participant.dateOfBirth,
        age: DateUtil.calculateAge(bp.participant.dateOfBirth),
        gender: bp.participant.gender,
        contactNumber: bp.participant.contactNumber,
        email: bp.participant.email,
        isGovtStudent: bp.participant.isGovtStudent || false,
      }));
    }

    return formatted;
  }
}

module.exports = new BookingService();
