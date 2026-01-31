/**
 * Participant Service
 * Business logic for participant operations
 */

const { prisma } = require("../../config/database");
const DateUtil = require("../../utils/date.util");
const FileUtil = require("../../utils/file.util");
const { GENDER, CATEGORY_GENDER_RULES } = require("../../config/constants");

class ParticipantService {
  /**
   * Create new participant
   * @param {number} userId - User ID (owner of participant)
   * @param {object} participantData - Participant data
   * @returns {Promise<object>} Created participant
   */
  async createParticipant(userId, participantData) {
    const { fullName, dateOfBirth, gender, eventRated, contactNumber, email, fideId, isGovtStudent } =
      participantData;

    // Calculate age from date of birth
    const age = DateUtil.calculateAge(dateOfBirth);

    // Create participant
    const participant = await prisma.participant.create({
      data: {
        userId,
        fullName,
        dateOfBirth: new Date(dateOfBirth),
        gender,
        eventRated: eventRated || null,
        contactNumber: contactNumber || null,
        email: email || null,
        fideId: fideId || null,
        isGovtStudent: isGovtStudent || false,
      },
    });

    // Add calculated age to response
    participant.age = age;

    // Format file URLs
    if (participant.passportPhoto) {
      participant.passportPhotoUrl = FileUtil.getFileUrl(
        participant.passportPhoto
      );
    }

    return participant;
  }

  /**
   * Get all participants for a user
   * @param {number} userId - User ID
   * @returns {Promise<array>} List of participants
   */
  async getUserParticipants(userId) {
    const participants = await prisma.participant.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    // Add calculated age and format URLs
    return participants.map((participant) => {
      participant.age = DateUtil.calculateAge(participant.dateOfBirth);

      if (participant.passportPhoto) {
        participant.passportPhotoUrl = FileUtil.getFileUrl(
          participant.passportPhoto
        );
      }
      if (participant.birthCertificate) {
        participant.birthCertificateUrl = FileUtil.getFileUrl(
          participant.birthCertificate
        );
      }
      if (participant.aadharCard) {
        participant.aadharCardUrl = FileUtil.getFileUrl(participant.aadharCard);
      }

      return participant;
    });
  }

  /**
   * Get participant by ID
   * @param {number} participantId - Participant ID
   * @param {number} userId - User ID (for ownership check)
   * @returns {Promise<object>} Participant details
   */
  async getParticipantById(participantId, userId) {
    const participant = await prisma.participant.findFirst({
      where: {
        participantId,
        userId,
      },
    });

    if (!participant) {
      throw new Error("Participant not found");
    }

    // Add calculated age
    participant.age = DateUtil.calculateAge(participant.dateOfBirth);

    // Format file URLs
    if (participant.passportPhoto) {
      participant.passportPhotoUrl = FileUtil.getFileUrl(
        participant.passportPhoto
      );
    }
    if (participant.birthCertificate) {
      participant.birthCertificateUrl = FileUtil.getFileUrl(
        participant.birthCertificate
      );
    }
    if (participant.aadharCard) {
      participant.aadharCardUrl = FileUtil.getFileUrl(participant.aadharCard);
    }

    return participant;
  }

  /**
   * Update participant
   * @param {number} participantId - Participant ID
   * @param {number} userId - User ID (for ownership check)
   * @param {object} updateData - Data to update
   * @returns {Promise<object>} Updated participant
   */
  async updateParticipant(participantId, userId, updateData) {
    // Check if participant exists and belongs to user
    const existingParticipant = await prisma.participant.findFirst({
      where: {
        participantId,
        userId,
      },
    });

    if (!existingParticipant) {
      throw new Error("Participant not found");
    }

    // Build update object
    const dataToUpdate = {};
    if (updateData.fullName) dataToUpdate.fullName = updateData.fullName;
    if (updateData.dateOfBirth)
      dataToUpdate.dateOfBirth = new Date(updateData.dateOfBirth);
    if (updateData.gender) dataToUpdate.gender = updateData.gender;
    if (updateData.eventRated !== undefined)
      dataToUpdate.eventRated = updateData.eventRated || null;
    if (updateData.contactNumber !== undefined)
      dataToUpdate.contactNumber = updateData.contactNumber || null;
    if (updateData.email !== undefined)
      dataToUpdate.email = updateData.email || null;
    if (updateData.fideId !== undefined)
      dataToUpdate.fideId = updateData.fideId || null;
    if (updateData.isGovtStudent !== undefined)
      dataToUpdate.isGovtStudent = updateData.isGovtStudent;

    // Update participant
    const participant = await prisma.participant.update({
      where: { participantId },
      data: dataToUpdate,
    });

    // Add calculated age
    participant.age = DateUtil.calculateAge(participant.dateOfBirth);

    // Format file URLs
    if (participant.passportPhoto) {
      participant.passportPhotoUrl = FileUtil.getFileUrl(
        participant.passportPhoto
      );
    }

    return participant;
  }

  /**
   * Delete participant
   * @param {number} participantId - Participant ID
   * @param {number} userId - User ID (for ownership check)
   * @returns {Promise<boolean>} Success status
   */
  async deleteParticipant(participantId, userId) {
    // Check if participant exists and belongs to user
    const participant = await prisma.participant.findFirst({
      where: {
        participantId,
        userId,
      },
    });

    if (!participant) {
      throw new Error("Participant not found");
    }

    // Check if participant has any bookings
    const bookingCount = await prisma.bookingParticipant.count({
      where: { participantId },
    });

    if (bookingCount > 0) {
      throw new Error("Cannot delete participant with existing bookings");
    }

    // Delete associated files
    if (participant.passportPhoto) {
      FileUtil.deleteFile(participant.passportPhoto);
    }
    if (participant.birthCertificate) {
      FileUtil.deleteFile(participant.birthCertificate);
    }
    if (participant.aadharCard) {
      FileUtil.deleteFile(participant.aadharCard);
    }

    // Delete participant
    await prisma.participant.delete({
      where: { participantId },
    });

    return true;
  }

  /**
   * Upload participant document
   * @param {number} participantId - Participant ID
   * @param {number} userId - User ID (for ownership check)
   * @param {string} documentType - Type of document (passportPhoto, birthCertificate, aadharCard)
   * @param {string} filePath - Uploaded file path
   * @returns {Promise<object>} Updated participant
   */
  async uploadDocument(participantId, userId, documentType, filePath) {
    // Check if participant exists and belongs to user
    const participant = await prisma.participant.findFirst({
      where: {
        participantId,
        userId,
      },
    });

    if (!participant) {
      throw new Error("Participant not found");
    }

    // Validate document type
    const validDocumentTypes = [
      "passportPhoto",
      "birthCertificate",
      "aadharCard",
    ];
    if (!validDocumentTypes.includes(documentType)) {
      throw new Error("Invalid document type");
    }

    // Delete old document if exists
    if (participant[documentType]) {
      FileUtil.deleteFile(participant[documentType]);
    }

    // Update participant with new document
    const updatedParticipant = await prisma.participant.update({
      where: { participantId },
      data: { [documentType]: filePath },
    });

    // Add calculated age
    updatedParticipant.age = DateUtil.calculateAge(
      updatedParticipant.dateOfBirth
    );

    // Format file URLs
    if (updatedParticipant.passportPhoto) {
      updatedParticipant.passportPhotoUrl = FileUtil.getFileUrl(
        updatedParticipant.passportPhoto
      );
    }
    if (updatedParticipant.birthCertificate) {
      updatedParticipant.birthCertificateUrl = FileUtil.getFileUrl(
        updatedParticipant.birthCertificate
      );
    }
    if (updatedParticipant.aadharCard) {
      updatedParticipant.aadharCardUrl = FileUtil.getFileUrl(
        updatedParticipant.aadharCard
      );
    }

    return updatedParticipant;
  }

  /**
   * Check if participant can register for a category based on gender rules
   * Female participants can register for both male and female categories
   * Male participants can only register for male categories
   * @param {string} participantGender - Participant gender (MALE/FEMALE/OTHERS)
   * @param {string} categoryGender - Category gender (MALE/FEMALE/null for open)
   * @returns {boolean} True if participant can register
   */
  canParticipantRegisterForCategory(participantGender, categoryGender) {
    // If category is open (null gender), anyone can register
    if (!categoryGender) {
      return true;
    }

    // If participant is FEMALE, they can register for any category
    if (participantGender === GENDER.FEMALE) {
      return true;
    }

    // If participant is MALE, they can only register for MALE categories
    if (participantGender === GENDER.MALE) {
      return categoryGender === GENDER.MALE;
    }

    // For OTHERS gender, same rules as MALE
    return categoryGender === GENDER.MALE;
  }

  /**
   * Get participant booking history
   * @param {number} participantId - Participant ID
   * @param {number} userId - User ID (for ownership check)
   * @returns {Promise<array>} Booking history
   */
  async getParticipantBookings(participantId, userId) {
    // Check if participant belongs to user
    const participant = await prisma.participant.findFirst({
      where: {
        participantId,
        userId,
      },
    });

    if (!participant) {
      throw new Error("Participant not found");
    }

    // Get bookings
    const bookings = await prisma.bookingParticipant.findMany({
      where: { participantId },
      include: {
        booking: {
          select: {
            bookingId: true,
            bookingReference: true,
            bookingStatus: true,
            paymentStatus: true,
            amountPaid: true,
            bookingDate: true,
          },
        },
        event: {
          select: {
            eventId: true,
            eventName: true,
            eventDates: true,
            location: true,
            eventStartTime: true,
            eventStatus: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return bookings.map((booking) => ({
      bookingParticipantId: booking.id,
      bookingId: booking.booking.bookingId,
      bookingReference: booking.booking.bookingReference,
      bookingStatus: booking.booking.bookingStatus,
      paymentStatus: booking.booking.paymentStatus,
      amountPaid: booking.booking.amountPaid,
      bookingDate: booking.booking.bookingDate,
      eventId: booking.event.eventId,
      eventName: booking.event.eventName,
      eventDates: DateUtil.parseEventDates(booking.event.eventDates),
      location: booking.event.location,
      eventStartTime: DateUtil.formatTime(booking.event.eventStartTime),
      eventStatus: booking.event.eventStatus,
    }));
  }
}

module.exports = new ParticipantService();
