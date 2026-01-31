/**
 * Enrollment Routes
 * Define all enrollment-related routes
 */

const express = require("express");
const router = express.Router();
const EnrollmentController = require("./enrollment.controller");
const { validate } = require("../../middleware/validation.middleware");
const { authenticate, isAdmin } = require("../../middleware/auth.middleware");
const {
  createEnrollmentSchema,
  listEnrollmentsQuerySchema,
  handleEnrollmentSchema,
  getEnrollmentByIdSchema,
} = require("./enrollment.validation");

/**
 * @route   POST /api/v1/enrollments
 * @desc    Create new enrollment (public - no login required)
 * @access  Public
 */
router.post(
  "/",
  validate(createEnrollmentSchema),
  EnrollmentController.createEnrollment
);

/**
 * @route   GET /api/v1/enrollments
 * @desc    Get all enrollments (admin only)
 * @access  Private (Admin)
 */
router.get(
  "/",
  authenticate,
  isAdmin,
  validate(listEnrollmentsQuerySchema, "query"),
  EnrollmentController.getEnrollments
);

/**
 * @route   GET /api/v1/enrollments/:enrollmentId
 * @desc    Get enrollment by ID (admin only)
 * @access  Private (Admin)
 */
router.get(
  "/:enrollmentId",
  authenticate,
  isAdmin,
  validate(getEnrollmentByIdSchema, "params"),
  EnrollmentController.getEnrollmentById
);

/**
 * @route   PUT /api/v1/enrollments/:enrollmentId
 * @desc    Handle enrollment - approve/reject (admin only)
 * @access  Private (Admin)
 */
router.put(
  "/:enrollmentId",
  authenticate,
  isAdmin,
  validate(getEnrollmentByIdSchema, "params"),
  validate(handleEnrollmentSchema),
  EnrollmentController.handleEnrollment
);

/**
 * @route   DELETE /api/v1/enrollments/:enrollmentId
 * @desc    Delete enrollment (admin only)
 * @access  Private (Admin)
 */
router.delete(
  "/:enrollmentId",
  authenticate,
  isAdmin,
  validate(getEnrollmentByIdSchema, "params"),
  EnrollmentController.deleteEnrollment
);

module.exports = router;
