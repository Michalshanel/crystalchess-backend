/**
 * Admin Routes
 * Define all admin-related routes
 */

const express = require("express");
const router = express.Router();
const AdminController = require("./admin.controller");
const { validate } = require("../../middleware/validation.middleware");
const { authenticate, isAdmin } = require("../../middleware/auth.middleware");
const {
  listUsersQuerySchema,
  updateUserStatusSchema,
  organizerApprovalSchema,
  updateUserSchema,
  handleEditRequestSchema,
  updateFeaturedStatusSchema,
  createUserSchema,
  getByIdSchema,
} = require("./admin.validation");

// All admin routes require authentication and admin role
router.use(authenticate, isAdmin);

/**
 * @route   GET /api/v1/admin/dashboard
 * @desc    Get dashboard statistics
 * @access  Private (Admin)
 */
router.get("/dashboard", AdminController.getDashboard);

/**
 * @route   GET /api/v1/admin/users
 * @desc    Get all users with filters
 * @access  Private (Admin)
 */
router.get(
  "/users",
  validate(listUsersQuerySchema, "query"),
  AdminController.getUsers,
);

/**
 * @route   POST /api/v1/admin/users
 * @desc    Create new user (no approval needed)
 * @access  Private (Admin)
 */
router.post("/users", validate(createUserSchema), AdminController.createUser);

/**
 * @route   PUT /api/v1/admin/users/:id/status
 * @desc    Update user status (active, inactive, suspended)
 * @access  Private (Admin)
 */
router.put(
  "/users/:id/status",
  validate(getByIdSchema, "params"),
  validate(updateUserStatusSchema),
  AdminController.updateUserStatus,
);

/**
 * @route   POST /api/v1/admin/users/:id/approve-organizer
 * @desc    Approve or reject organizer
 * @access  Private (Admin)
 */
router.post(
  "/users/:id/approve-organizer",
  validate(getByIdSchema, "params"),
  validate(organizerApprovalSchema),
  AdminController.handleOrganizerApproval,
);

/**
 * @route   PUT /api/v1/admin/users/:id
 * @desc    Update user details
 * @access  Private (Admin)
 */
router.put(
  "/users/:id",
  validate(getByIdSchema, "params"),
  validate(updateUserSchema),
  AdminController.updateUser,
);

/**
 * @route   DELETE /api/v1/admin/users/:id
 * @desc    Delete user
 * @access  Private (Admin)
 */
router.delete(
  "/users/:id",
  validate(getByIdSchema, "params"),
  AdminController.deleteUser,
);

/**
 * @route   GET /api/v1/admin/events
 * @desc    Get all events (admin view)
 * @access  Private (Admin)
 */
router.get(
  "/events",
  validate(listUsersQuerySchema, "query"),
  AdminController.getEvents,
);

/**
 * @route   PUT /api/v1/admin/events/:id/featured
 * @desc    Update event featured status
 * @access  Private (Admin)
 */
router.put(
  "/events/:id/featured",
  validate(getByIdSchema, "params"),
  validate(updateFeaturedStatusSchema),
  AdminController.updateEventFeaturedStatus,
);

/**
 * @route   PUT /api/v1/admin/events/:id
 * @desc    Admin update event (can edit any event)
 * @access  Private (Admin)
 */
router.put(
  "/events/:id",
  validate(getByIdSchema, "params"),
  AdminController.adminUpdateEvent,
);

/**
 * @route   DELETE /api/v1/admin/events/:id
 * @desc    Delete event
 * @access  Private (Admin)
 */
router.delete(
  "/events/:id",
  validate(getByIdSchema, "params"),
  AdminController.deleteEvent,
);

/**
 * @route   GET /api/v1/admin/edit-requests
 * @desc    Get all event edit/delete requests
 * @access  Private (Admin)
 */
router.get(
  "/edit-requests",
  validate(listUsersQuerySchema, "query"),
  AdminController.getEditRequests,
);

/**
 * @route   PUT /api/v1/admin/edit-requests/:id
 * @desc    Handle edit request (approve/reject)
 * @access  Private (Admin)
 */
router.put(
  "/edit-requests/:id",
  validate(getByIdSchema, "params"),
  validate(handleEditRequestSchema),
  AdminController.handleEditRequest,
);

/**
 * @route   GET /api/v1/admin/participants/:id
 * @desc    Get participant details (admin can view any)
 * @access  Private (Admin)
 */
router.get(
  "/participants/:id",
  validate(getByIdSchema, "params"),
  AdminController.getParticipant,
);

/**
 * @route   GET /api/v1/admin/audit-logs
 * @desc    Get audit logs
 * @access  Private (Admin)
 */
router.get(
  "/audit-logs",
  validate(listUsersQuerySchema, "query"),
  AdminController.getAuditLogs,
);

/**
 * @route   GET /api/v1/admin/bookings
 * @desc    Get all bookings (admin view)
 * @access  Private (Admin)
 */
router.get(
  "/bookings",
  validate(listUsersQuerySchema, "query"),
  AdminController.getBookings,
);

/**
 * @route   GET /api/v1/admin/bookings/export
 * @desc    Export bookings as CSV
 * @access  Private (Admin)
 */
router.get("/bookings/export", AdminController.exportBookings);

/**
 * @route   PUT /api/v1/admin/bookings/:id/status
 * @desc    Update booking status
 * @access  Private (Admin)
 */
router.put(
  "/bookings/:id/status",
  validate(getByIdSchema, "params"),
  AdminController.updateBookingStatus,
);

module.exports = router;
