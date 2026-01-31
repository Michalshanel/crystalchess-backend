/**
 * Admin Service
 * Business logic for admin operations
 */

const { prisma } = require("../../config/database");
const HashUtil = require("../../utils/hash.util");
const EmailService = require("../notifications/email.service");
const DateUtil = require("../../utils/date.util");
const {
  USER_STATUS,
  DEFAULT_PAGE_SIZE,
  ENTITY_TYPES,
} = require("../../config/constants");

class AdminService {
  /**
   * Create audit log entry
   * @param {number} adminId - Admin user ID
   * @param {string} action - Action performed
   * @param {string} entityType - Entity type
   * @param {number} entityId - Entity ID
   * @param {object} oldValues - Old values
   * @param {object} newValues - New values
   */
  async createAuditLog(
    adminId,
    action,
    entityType,
    entityId,
    oldValues = null,
    newValues = null,
  ) {
    await prisma.auditLog.create({
      data: {
        adminId,
        action,
        entityType,
        entityId,
        oldValues: oldValues ? JSON.stringify(oldValues) : null,
        newValues: newValues ? JSON.stringify(newValues) : null,
      },
    });
  }

  /**
   * Get dashboard statistics
   * @returns {Promise<object>} Dashboard statistics
   */
  async getDashboardStats() {
    // Total users by type
    const totalUsers = await prisma.user.count();
    const totalPlayers = await prisma.user.count({
      where: { userType: "PLAYER" },
    });
    const totalOrganizers = await prisma.user.count({
      where: { userType: "ORGANIZER", organizerApproved: true },
    });
    const pendingOrganizers = await prisma.user.count({
      where: { userType: "ORGANIZER", organizerApproved: false },
    });

    // Total events by status
    const totalEvents = await prisma.event.count();
    const upcomingEvents = await prisma.event.count({
      where: { eventStatus: "UPCOMING" },
    });
    const completedEvents = await prisma.event.count({
      where: { eventStatus: "COMPLETED" },
    });
    const featuredEvents = await prisma.event.count({
      where: { isFeatured: true },
    });

    // Total bookings - only count confirmed bookings
    const confirmedBookings = await prisma.booking.count({
      where: { bookingStatus: "CONFIRMED" },
    });
    const pendingBookings = await prisma.booking.count({
      where: { bookingStatus: "PENDING" },
    });
    const allBookings = await prisma.booking.count();

    // Only count revenue from confirmed bookings with paid status
    const paidBookings = await prisma.booking.findMany({
      where: {
        bookingStatus: "CONFIRMED",
        paymentStatus: "PAID",
      },
      select: { amountPaid: true },
    });

    const totalRevenue = paidBookings.reduce(
      (sum, b) => sum + Number(b.amountPaid || 0),
      0,
    );

    // Only count platform fees from completed payments
    const successfulPayments = await prisma.payment.findMany({
      where: {
        paymentStatus: "completed",
      },
      select: { adminCommission: true },
    });

    const totalPlatformFees = successfulPayments.reduce(
      (sum, p) => sum + Number(p.adminCommission || 0),
      0,
    );

    // Total participants
    const totalParticipants = await prisma.participant.count();

    // Recent activities (last 7 days)
    const sevenDaysAgo = DateUtil.addDays(new Date(), -7);
    const recentUsers = await prisma.user.count({
      where: { createdAt: { gte: sevenDaysAgo } },
    });
    const recentBookings = await prisma.booking.count({
      where: { bookingDate: { gte: sevenDaysAgo } },
    });

    // Pending actions
    const pendingEditRequests = await prisma.eventEditRequest.count({
      where: { status: "PENDING" },
    });

    return {
      users: {
        total: totalUsers,
        players: totalPlayers,
        organizers: totalOrganizers,
        pendingOrganizers,
        recentUsers,
      },
      events: {
        total: totalEvents,
        upcoming: upcomingEvents,
        completed: completedEvents,
        featured: featuredEvents,
      },
      bookings: {
        total: confirmedBookings, // Main stat shows confirmed only
        confirmed: confirmedBookings,
        pending: pendingBookings,
        all: allBookings,
        recent: recentBookings,
      },
      revenue: {
        total: totalRevenue.toFixed(2),
        platformFees: totalPlatformFees.toFixed(2),
      },
      participants: {
        total: totalParticipants,
      },
      pendingActions: {
        organizerApprovals: pendingOrganizers,
        editRequests: pendingEditRequests,
      },
    };
  }

  /**
   * Get all users with filters
   * @param {object} filters - Query filters
   * @returns {Promise<object>} Paginated users
   */
  async getUsers(filters = {}) {
    const {
      page = 1,
      limit = DEFAULT_PAGE_SIZE,
      userType,
      userStatus,
      search,
      organizerApproved,
    } = filters;

    const where = {};
    if (userType) where.userType = userType;
    if (userStatus) where.userStatus = userStatus;
    if (organizerApproved !== undefined)
      where.organizerApproved = organizerApproved;

    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const total = await prisma.user.count({ where });

    const users = await prisma.user.findMany({
      where,
      select: {
        userId: true,
        email: true,
        fullName: true,
        phone: true,
        userType: true,
        organizerApproved: true,
        userStatus: true,
        emailVerified: true,
        createdAt: true,
        lastLogin: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update user status (active, inactive, suspended)
   * @param {number} userId - User ID
   * @param {string} userStatus - New user status
   * @param {number} adminId - Admin user ID
   * @returns {Promise<object>} Updated user
   */
  async updateUserStatus(userId, userStatus, adminId) {
    const user = await prisma.user.findUnique({ where: { userId } });

    if (!user) {
      throw new Error("User not found");
    }

    const oldStatus = user.userStatus;

    const updatedUser = await prisma.user.update({
      where: { userId },
      data: { userStatus },
      select: {
        userId: true,
        email: true,
        fullName: true,
        userType: true,
        userStatus: true,
      },
    });

    // Create audit log
    await this.createAuditLog(
      adminId,
      "UPDATE_USER_STATUS",
      ENTITY_TYPES.USER,
      userId,
      { userStatus: oldStatus },
      { userStatus },
    );

    return updatedUser;
  }

  /**
   * Update user details
   */
  async updateUser(userId, updateData, adminId) {
    const user = await prisma.user.findUnique({ where: { userId } });

    if (!user) throw new Error("User not found");

    if (user.userType === "ADMIN") {
      throw new Error("Admin users cannot be edited");
    }

    const updatedUser = await prisma.user.update({
      where: { userId },
      data: updateData,
      select: {
        userId: true,
        email: true,
        fullName: true,
        phone: true,
        userType: true,
        userStatus: true,
        organizerApproved: true,
      },
    });

    // Audit log
    await this.createAuditLog(
      adminId,
      "UPDATE_USER",
      ENTITY_TYPES.USER,
      userId,
      user,
      updatedUser,
    );

    return updatedUser;
  }

  /**
   * Approve or reject organizer
   * @param {number} userId - User ID
   * @param {boolean} approved - Approval status
   * @param {string} rejectionReason - Rejection reason (if rejected)
   * @param {number} adminId - Admin user ID
   * @returns {Promise<object>} Updated user
   */
  async handleOrganizerApproval(userId, approved, rejectionReason, adminId) {
    const user = await prisma.user.findUnique({ where: { userId } });

    if (!user) {
      throw new Error("User not found");
    }

    if (user.userType !== "ORGANIZER") {
      throw new Error("User is not an organizer");
    }

    if (user.organizerApproved && approved) {
      throw new Error("Organizer is already approved");
    }

    const updatedUser = await prisma.user.update({
      where: { userId },
      data: { organizerApproved: approved },
      select: {
        userId: true,
        email: true,
        fullName: true,
        userType: true,
        organizerApproved: true,
      },
    });

    // Create audit log
    await this.createAuditLog(
      adminId,
      approved ? "APPROVE_ORGANIZER" : "REJECT_ORGANIZER",
      ENTITY_TYPES.USER,
      userId,
      { organizerApproved: user.organizerApproved },
      { organizerApproved: approved },
    );

    // Send email notification
    try {
      if (approved) {
        await EmailService.sendOrganizerApprovalEmail(user);
      } else {
        await EmailService.sendOrganizerRejectionEmail(user, rejectionReason);
      }
    } catch (error) {
      console.error("Failed to send email:", error);
    }

    return updatedUser;
  }

  /**
   * Create user (admin creates user without approval)
   * @param {object} userData - User data
   * @param {number} adminId - Admin user ID
   * @returns {Promise<object>} Created user
   */
  async createUser(userData, adminId) {
    const { email, password, fullName, phone, userType } = userData;

    // Check if email exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error("Email already exists");
    }

    // Hash password
    const passwordHash = await HashUtil.hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        phone,
        userType,
        userStatus: USER_STATUS.ACTIVE,
        emailVerified: true, // Admin-created users are auto-verified
        organizerApproved: userType === "ORGANIZER" ? true : false, // Auto-approve if organizer
      },
      select: {
        userId: true,
        email: true,
        fullName: true,
        phone: true,
        userType: true,
        organizerApproved: true,
        emailVerified: true,
      },
    });

    // Create audit log
    await this.createAuditLog(
      adminId,
      "CREATE_USER",
      ENTITY_TYPES.USER,
      user.userId,
      null,
      user,
    );

    return user;
  }

  /**
   * Delete user
   * @param {number} userId - User ID
   * @param {number} adminId - Admin user ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteUser(userId, adminId) {
    const user = await prisma.user.findUnique({ where: { userId } });

    if (!user) {
      throw new Error("User not found");
    }

    if (user.userType === "ADMIN") {
      throw new Error("Cannot delete admin users");
    }

    // Check if user has bookings
    const bookingCount = await prisma.booking.count({ where: { userId } });
    if (bookingCount > 0) {
      throw new Error("Cannot delete user with existing bookings");
    }

    // Delete user (cascades to participants)
    await prisma.user.delete({ where: { userId } });

    // Create audit log
    await this.createAuditLog(
      adminId,
      "DELETE_USER",
      ENTITY_TYPES.USER,
      userId,
      user,
      null,
    );

    return true;
  }

  /**
   * Get all events (admin view)
   * @param {object} filters - Query filters
   * @returns {Promise<object>} Paginated events
   */
  async getEvents(filters = {}) {
    const {
      page = 1,
      limit = DEFAULT_PAGE_SIZE,
      eventStatus,
      search,
      isFeatured,
    } = filters;

    const where = {};
    if (eventStatus) where.eventStatus = eventStatus;
    if (isFeatured !== undefined) where.isFeatured = isFeatured;

    if (search) {
      where.OR = [
        { eventName: { contains: search } },
        { location: { contains: search } },
      ];
    }

    const total = await prisma.event.count({ where });

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
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      events: events.map((event) => ({
        ...event,
        eventDates: DateUtil.parseEventDates(event.eventDates),
        eventStartTime: DateUtil.formatTime(event.eventStartTime),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update event featured status
   * @param {number} eventId - Event ID
   * @param {boolean} isFeatured - Featured status
   * @param {number} adminId - Admin user ID
   * @returns {Promise<object>} Updated event
   */
  async updateEventFeaturedStatus(eventId, isFeatured, adminId) {
    const event = await prisma.event.findUnique({ where: { eventId } });

    if (!event) {
      throw new Error("Event not found");
    }

    const updatedEvent = await prisma.event.update({
      where: { eventId },
      data: { isFeatured },
      select: {
        eventId: true,
        eventName: true,
        isFeatured: true,
        eventStatus: true,
      },
    });

    // Create audit log
    await this.createAuditLog(
      adminId,
      "UPDATE_FEATURED_STATUS",
      ENTITY_TYPES.EVENT,
      eventId,
      { isFeatured: event.isFeatured },
      { isFeatured },
    );

    return updatedEvent;
  }

  /**
   * Delete event
   * @param {number} eventId - Event ID
   * @param {number} adminId - Admin user ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteEvent(eventId, adminId) {
    const event = await prisma.event.findUnique({ where: { eventId } });

    if (!event) {
      throw new Error("Event not found");
    }

    // Check if event has confirmed bookings
    const confirmedBookings = await prisma.booking.count({
      where: {
        eventId,
        bookingStatus: "CONFIRMED",
      },
    });

    if (confirmedBookings > 0) {
      throw new Error("Cannot delete event with confirmed bookings");
    }

    // Delete event
    await prisma.event.delete({ where: { eventId } });

    // Create audit log
    await this.createAuditLog(
      adminId,
      "DELETE_EVENT",
      ENTITY_TYPES.EVENT,
      eventId,
      { eventName: event.eventName },
      null,
    );

    return true;
  }

  /**
   * Get all edit requests
   * @param {object} filters - Query filters
   * @returns {Promise<object>} Paginated edit requests
   */
  async getEditRequests(filters = {}) {
    const { page = 1, limit = DEFAULT_PAGE_SIZE, status } = filters;

    const where = {};
    if (status) where.status = status.toUpperCase();

    const total = await prisma.eventEditRequest.count({ where });

    const requests = await prisma.eventEditRequest.findMany({
      where,
      include: {
        event: {
          select: {
            eventId: true,
            eventName: true,
            eventStatus: true,
          },
        },
        users: {
          select: {
            userId: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Map 'users' to 'organizer' for frontend compatibility
    const formattedRequests = requests.map((req) => ({
      ...req,
      organizer: req.users,
      users: undefined,
    }));

    return {
      requests: formattedRequests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Handle edit request (approve/reject)
   * @param {number} requestId - Request ID
   * @param {string} status - APPROVED or REJECTED
   * @param {number} adminId - Admin user ID
   * @returns {Promise<object>} Updated request
   */
  async handleEditRequest(requestId, status, adminId) {
    const request = await prisma.eventEditRequest.findUnique({
      where: { requestId },
      include: { event: true },
    });

    if (!request) {
      throw new Error("Edit request not found");
    }

    if (request.status !== "PENDING") {
      throw new Error("Request has already been processed");
    }

    const updatedRequest = await prisma.eventEditRequest.update({
      where: { requestId },
      data: { status },
      include: {
        event: {
          select: {
            eventId: true,
            eventName: true,
            eventStatus: true,
          },
        },
      },
    });

    // Create audit log
    await this.createAuditLog(
      adminId,
      status === "APPROVED" ? "APPROVE_EDIT_REQUEST" : "REJECT_EDIT_REQUEST",
      ENTITY_TYPES.EVENT,
      request.eventId,
      { eventName: request.event.eventName, message: request.message },
      null,
    );

    return updatedRequest;
  }

  /**
   * Admin update event (admin can edit any event)
   * @param {number} eventId - Event ID
   * @param {object} updateData - Data to update
   * @param {number} adminId - Admin user ID
   * @returns {Promise<object>} Updated event
   */
  async adminUpdateEvent(eventId, updateData, adminId) {
    const event = await prisma.event.findUnique({
      where: { eventId },
    });

    if (!event) {
      throw new Error("Event not found");
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
        // Already in ISO format
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
          // Already in ISO format
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
    if (updateData.isFeatured !== undefined)
      dataToUpdate.isFeatured = updateData.isFeatured;
    if (updateData.govtConcessionType !== undefined)
      dataToUpdate.govtConcessionType = updateData.govtConcessionType;
    if (updateData.govtConcessionValue !== undefined)
      dataToUpdate.govtConcessionValue = updateData.govtConcessionValue;

    const updatedEvent = await prisma.event.update({
      where: { eventId },
      data: dataToUpdate,
    });

    // Create audit log
    await this.createAuditLog(
      adminId,
      "ADMIN_UPDATE_EVENT",
      ENTITY_TYPES.EVENT,
      eventId,
      event,
      updatedEvent,
    );

    return updatedEvent;
  }

  /**
   * Get participant with user details (admin can view any participant)
   * @param {number} participantId - Participant ID
   * @returns {Promise<object>} Participant details
   */
  async getParticipant(participantId) {
    const participant = await prisma.participant.findUnique({
      where: { participantId },
      include: {
        user: {
          select: {
            userId: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!participant) {
      throw new Error("Participant not found");
    }

    participant.age = DateUtil.calculateAge(participant.dateOfBirth);
    return participant;
  }

  /**
   * Get all bookings (admin view)
   * @param {object} filters - Query filters
   * @returns {Promise<object>} Paginated bookings
   */
  async getBookings(filters = {}) {
    const {
      page = 1,
      limit = DEFAULT_PAGE_SIZE,
      bookingStatus,
      paymentStatus,
      search,
      startDate,
      endDate,
      eventId,
    } = filters;

    const where = {};
    if (eventId) where.eventId = parseInt(eventId);
    if (bookingStatus) where.bookingStatus = bookingStatus;
    if (paymentStatus) where.paymentStatus = paymentStatus;

    // Date range filter
    if (startDate || endDate) {
      where.bookingDate = {};
      if (startDate) where.bookingDate.gte = new Date(startDate);
      if (endDate) where.bookingDate.lte = new Date(endDate);
    }

    // Search by booking reference or user name/email
    if (search) {
      where.OR = [
        { bookingReference: { contains: search } },
        { user: { fullName: { contains: search } } },
        { user: { email: { contains: search } } },
        { event: { eventName: { contains: search } } },
      ];
    }

    const total = await prisma.booking.count({ where });

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        user: {
          select: {
            userId: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
        event: {
          select: {
            eventId: true,
            eventName: true,
            eventDates: true,
            location: true,
            entryFee: true,
          },
        },
        participants: {
          select: {
            id: true,
            participant: {
              select: {
                participantId: true,
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: { bookingDate: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Format bookings
    const formattedBookings = bookings.map((booking) => ({
      ...booking,
      event: booking.event
        ? {
            ...booking.event,
            eventDates: DateUtil.parseEventDates(booking.event.eventDates),
          }
        : null,
      // Flatten participants for easier frontend consumption
      participants: booking.participants.map((bp) => ({
        participantId: bp.participant.participantId,
        fullName: bp.participant.fullName,
      })),
    }));

    return {
      bookings: formattedBookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Export bookings data (for CSV/Excel download)
   * @param {object} filters - Query filters
   * @returns {Promise<array>} Bookings data for export
   */
  async exportBookings(filters = {}) {
    const { eventId, bookingStatus, paymentStatus, startDate, endDate } = filters;

    const where = {};
    if (eventId) where.eventId = parseInt(eventId);
    if (bookingStatus) where.bookingStatus = bookingStatus;
    if (paymentStatus) where.paymentStatus = paymentStatus;

    if (startDate || endDate) {
      where.bookingDate = {};
      if (startDate) where.bookingDate.gte = new Date(startDate);
      if (endDate) where.bookingDate.lte = new Date(endDate);
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            phone: true,
          },
        },
        event: {
          select: {
            eventId: true,
            eventName: true,
            eventDates: true,
            location: true,
            entryFee: true,
          },
        },
        participants: {
          select: {
            participant: {
              select: {
                fullName: true,
                dateOfBirth: true,
                gender: true,
                fideId: true,
                contactNumber: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { bookingDate: "desc" },
    });

    // Format data for export
    const exportData = [];

    bookings.forEach((booking) => {
      // If booking has participants, create a row for each participant
      if (booking.participants && booking.participants.length > 0) {
        booking.participants.forEach((bp, index) => {
          exportData.push({
            bookingReference: booking.bookingReference,
            eventName: booking.event?.eventName || "",
            eventDate: booking.event?.eventDates ? DateUtil.parseEventDates(booking.event.eventDates)[0] : "",
            eventLocation: booking.event?.location || "",
            bookedByName: booking.user?.fullName || "",
            bookedByEmail: booking.user?.email || "",
            bookedByPhone: booking.user?.phone || "",
            participantName: bp.participant?.fullName || "",
            participantDOB: bp.participant?.dateOfBirth ? new Date(bp.participant.dateOfBirth).toISOString().split("T")[0] : "",
            participantGender: bp.participant?.gender || "",
            participantFideId: bp.participant?.fideId || "",
            participantContact: bp.participant?.contactNumber || "",
            participantEmail: bp.participant?.email || "",
            amountPaid: Number(booking.amountPaid || 0),
            bookingStatus: booking.bookingStatus,
            paymentStatus: booking.paymentStatus,
            bookingDate: booking.bookingDate ? new Date(booking.bookingDate).toISOString().split("T")[0] : "",
          });
        });
      } else {
        // No participants, just add booking info
        exportData.push({
          bookingReference: booking.bookingReference,
          eventName: booking.event?.eventName || "",
          eventDate: booking.event?.eventDates ? DateUtil.parseEventDates(booking.event.eventDates)[0] : "",
          eventLocation: booking.event?.location || "",
          bookedByName: booking.user?.fullName || "",
          bookedByEmail: booking.user?.email || "",
          bookedByPhone: booking.user?.phone || "",
          participantName: "",
          participantDOB: "",
          participantGender: "",
          participantFideId: "",
          participantContact: "",
          participantEmail: "",
          amountPaid: Number(booking.amountPaid || 0),
          bookingStatus: booking.bookingStatus,
          paymentStatus: booking.paymentStatus,
          bookingDate: booking.bookingDate ? new Date(booking.bookingDate).toISOString().split("T")[0] : "",
        });
      }
    });

    return exportData;
  }

  /**
   * Update booking status (admin)
   * @param {number} bookingId - Booking ID
   * @param {string} bookingStatus - New status
   * @param {string} remarks - Admin remarks
   * @param {number} adminId - Admin user ID
   * @returns {Promise<object>} Updated booking
   */
  async updateBookingStatus(bookingId, bookingStatus, remarks, adminId) {
    const booking = await prisma.booking.findUnique({
      where: { bookingId },
      include: { event: true },
    });

    if (!booking) {
      throw new Error("Booking not found");
    }

    const oldStatus = booking.bookingStatus;

    const updatedBooking = await prisma.booking.update({
      where: { bookingId },
      data: {
        bookingStatus,
        adminRemarks: remarks || null,
      },
      include: {
        user: {
          select: {
            userId: true,
            fullName: true,
            email: true,
          },
        },
        event: {
          select: {
            eventId: true,
            eventName: true,
          },
        },
      },
    });

    // Create audit log
    await this.createAuditLog(
      adminId,
      "UPDATE_BOOKING_STATUS",
      ENTITY_TYPES.BOOKING,
      bookingId,
      { bookingStatus: oldStatus },
      { bookingStatus, remarks },
    );

    return updatedBooking;
  }

  /**
   * Get all audit logs
   * @param {object} filters - Query filters
   * @returns {Promise<object>} Paginated audit logs
   */
  async getAuditLogs(filters = {}) {
    const {
      page: rawPage = 1,
      limit: rawLimit = DEFAULT_PAGE_SIZE,
      entityType,
      action,
      startDate,
      endDate,
    } = filters;

    // Parse page and limit as integers
    const page = parseInt(rawPage, 10) || 1;
    const limit = parseInt(rawLimit, 10) || DEFAULT_PAGE_SIZE;

    const where = {};

    // Filter by entity type - convert to uppercase for Prisma enum
    if (entityType) {
      where.entityType = entityType.toUpperCase();
    }

    // Filter by action (supports partial match for action strings like UPDATE_USER_STATUS)
    if (action) {
      where.action = {
        contains: action.toUpperCase(),
      };
    }

    // Filter by date range
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        // Set end date to end of day
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDateTime;
      }
    }

    const total = await prisma.auditLog.count({ where });

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        admin: {
          select: {
            userId: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

module.exports = new AdminService();
