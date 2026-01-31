/**
 * Enrollment Service
 * Business logic for class enrollment operations
 */

const { prisma } = require("../../config/database");
const EmailService = require("../notifications/email.service");
const {
  DEFAULT_PAGE_SIZE,
  ENROLLMENT_STATUS,
} = require("../../config/constants");

class EnrollmentService {
  /**
   * Create new enrollment (public - no login required)
   * @param {object} enrollmentData - Enrollment form data
   * @returns {Promise<object>} Created enrollment
   */
  async createEnrollment(enrollmentData) {
    const {
      className,
      studentName,
      studentEmail,
      studentPhone,
      studentAge,
      parentName,
      parentPhone,
      parentEmail,
      preferredSchedule,
      preferredDays,
      address,
      city,
      state,
      pincode,
      previousExperience,
      message,
    } = enrollmentData;

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        className,
        studentName,
        studentEmail,
        studentPhone,
        studentAge,
        parentName: parentName || null,
        parentPhone: parentPhone || null,
        parentEmail: parentEmail || null,
        preferredSchedule,
        preferredDays: preferredDays || null,
        address: address || null,
        city: city || null,
        state: state || null,
        pincode: pincode || null,
        previousExperience: previousExperience || "NONE",
        message: message || null,
        enrollmentStatus: ENROLLMENT_STATUS.PENDING,
      },
    });

    // Send notification email to admin
    try {
      await EmailService.sendEnrollmentNotificationToAdmin(enrollment);
    } catch (error) {
      console.error("Failed to send enrollment notification to admin:", error);
    }

    return enrollment;
  }

  /**
   * Get all enrollments (admin)
   * @param {object} filters - Query filters
   * @returns {Promise<object>} Paginated enrollments
   */
  async getEnrollments(filters = {}) {
    const {
      page: rawPage = 1,
      limit: rawLimit = DEFAULT_PAGE_SIZE,
      enrollmentStatus,
      search,
    } = filters;

    // Parse page and limit as integers
    const page = parseInt(rawPage, 10) || 1;
    const limit = parseInt(rawLimit, 10) || DEFAULT_PAGE_SIZE;

    const where = {};
    // Convert to uppercase for Prisma enum
    if (enrollmentStatus) where.enrollmentStatus = enrollmentStatus.toUpperCase();

    if (search) {
      where.OR = [
        { studentName: { contains: search } },
        { studentEmail: { contains: search } },
        { studentPhone: { contains: search } },
        { className: { contains: search } },
      ];
    }

    const total = await prisma.enrollment.count({ where });

    const enrollments = await prisma.enrollment.findMany({
      where,
      orderBy: { enrollmentDate: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      enrollments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get enrollment by ID (admin)
   * @param {number} enrollmentId - Enrollment ID
   * @returns {Promise<object>} Enrollment details
   */
  async getEnrollmentById(enrollmentId) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { enrollmentId },
    });

    if (!enrollment) {
      throw new Error("Enrollment not found");
    }

    return enrollment;
  }

  /**
   * Handle enrollment (approve/reject) - admin only
   * @param {number} enrollmentId - Enrollment ID
   * @param {string} enrollmentStatus - APPROVED or REJECTED
   * @param {string} rejectionReason - Rejection reason (if rejected)
   * @param {string} notes - Admin notes
   * @param {number} adminId - Admin user ID
   * @returns {Promise<object>} Updated enrollment
   */
  async handleEnrollment(
    enrollmentId,
    enrollmentStatus,
    rejectionReason,
    notes,
    adminId
  ) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { enrollmentId },
    });

    if (!enrollment) {
      throw new Error("Enrollment not found");
    }

    if (enrollment.enrollmentStatus !== ENROLLMENT_STATUS.PENDING) {
      throw new Error("Enrollment has already been processed");
    }

    // Update enrollment
    const updatedEnrollment = await prisma.enrollment.update({
      where: { enrollmentId },
      data: {
        enrollmentStatus,
        rejectionReason: rejectionReason || null,
        notes: notes || null,
        approvedDate: enrollmentStatus === "APPROVED" ? new Date() : null,
        approvedBy: enrollmentStatus === "APPROVED" ? adminId : null,
      },
    });

    // TODO: Send email to student/parent about approval/rejection
    // You can implement this email notification as needed

    return updatedEnrollment;
  }

  /**
   * Delete enrollment (admin only)
   * @param {number} enrollmentId - Enrollment ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteEnrollment(enrollmentId) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { enrollmentId },
    });

    if (!enrollment) {
      throw new Error("Enrollment not found");
    }

    await prisma.enrollment.delete({
      where: { enrollmentId },
    });

    return true;
  }
}

module.exports = new EnrollmentService();
