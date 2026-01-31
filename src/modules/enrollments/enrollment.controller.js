/**
 * Enrollment Controller
 * Handles HTTP requests for enrollment endpoints
 */

const EnrollmentService = require("./enrollment.service");
const ResponseUtil = require("../../utils/response.util");
const { asyncHandler } = require("../../middleware/errorHandler.middleware");

class EnrollmentController {
  /**
   * Create new enrollment (public)
   * POST /api/v1/enrollments
   */
  createEnrollment = asyncHandler(async (req, res) => {
    const enrollment = await EnrollmentService.createEnrollment(req.body);

    ResponseUtil.created(
      res,
      enrollment,
      "Enrollment submitted successfully. We will contact you soon."
    );
  });

  /**
   * Get all enrollments (admin)
   * GET /api/v1/enrollments
   */
  getEnrollments = asyncHandler(async (req, res) => {
    const result = await EnrollmentService.getEnrollments(req.query);

    ResponseUtil.paginated(
      res,
      result.enrollments,
      result.pagination.page,
      result.pagination.limit,
      result.pagination.total,
      "Enrollments retrieved successfully"
    );
  });

  /**
   * Get enrollment by ID (admin)
   * GET /api/v1/enrollments/:enrollmentId
   */
  getEnrollmentById = asyncHandler(async (req, res) => {
    const enrollment = await EnrollmentService.getEnrollmentById(
      parseInt(req.params.enrollmentId)
    );

    ResponseUtil.success(res, enrollment, "Enrollment retrieved successfully");
  });

  /**
   * Handle enrollment - approve/reject (admin)
   * PUT /api/v1/enrollments/:enrollmentId
   */
  handleEnrollment = asyncHandler(async (req, res) => {
    const { enrollmentStatus, rejectionReason, notes } = req.body;

    const enrollment = await EnrollmentService.handleEnrollment(
      parseInt(req.params.enrollmentId),
      enrollmentStatus,
      rejectionReason,
      notes,
      req.user.userId
    );

    ResponseUtil.success(
      res,
      enrollment,
      enrollmentStatus === "APPROVED"
        ? "Enrollment approved successfully"
        : "Enrollment rejected successfully"
    );
  });

  /**
   * Delete enrollment (admin)
   * DELETE /api/v1/enrollments/:enrollmentId
   */
  deleteEnrollment = asyncHandler(async (req, res) => {
    await EnrollmentService.deleteEnrollment(parseInt(req.params.enrollmentId));

    ResponseUtil.success(res, null, "Enrollment deleted successfully");
  });
}

module.exports = new EnrollmentController();
