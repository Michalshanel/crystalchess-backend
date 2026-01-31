/**
 * Admin Controller
 * Handles HTTP requests for admin endpoints
 */

const AdminService = require("./admin.service");
const ResponseUtil = require("../../utils/response.util");
const { asyncHandler } = require("../../middleware/errorHandler.middleware");

class AdminController {
  /**
   * Get dashboard statistics
   * GET /api/v1/admin/dashboard
   */
  getDashboard = asyncHandler(async (req, res) => {
    const stats = await AdminService.getDashboardStats();

    ResponseUtil.success(
      res,
      stats,
      "Dashboard statistics retrieved successfully",
    );
  });

  /**
   * Get all users with filters
   * GET /api/v1/admin/users
   */
  getUsers = asyncHandler(async (req, res) => {
    const result = await AdminService.getUsers(req.query);

    ResponseUtil.paginated(
      res,
      result.users,
      result.pagination.page,
      result.pagination.limit,
      result.pagination.total,
      "Users retrieved successfully",
    );
  });

  /**
   * Update user status
   * PUT /api/v1/admin/users/:id/status
   */
  updateUserStatus = asyncHandler(async (req, res) => {
    const user = await AdminService.updateUserStatus(
      parseInt(req.params.id),
      req.body.userStatus,
      req.user.userId,
    );

    ResponseUtil.success(res, user, "User status updated successfully");
  });

  /**
   * Approve or reject organizer
   * POST /api/v1/admin/users/:id/approve-organizer
   */
  handleOrganizerApproval = asyncHandler(async (req, res) => {
    const { approved, rejectionReason } = req.body;

    const user = await AdminService.handleOrganizerApproval(
      parseInt(req.params.id),
      approved,
      rejectionReason,
      req.user.userId,
    );

    ResponseUtil.success(
      res,
      user,
      approved
        ? "Organizer approved successfully"
        : "Organizer rejected successfully",
    );
  });

  /**
   * Create new user (admin)
   * POST /api/v1/admin/users
   */
  createUser = asyncHandler(async (req, res) => {
    const user = await AdminService.createUser(req.body, req.user.userId);

    ResponseUtil.created(res, user, "User created successfully");
  });

  /**
   * Update user details
   * PUT /api/v1/admin/users/:id
   */
  updateUser = asyncHandler(async (req, res) => {
    const user = await AdminService.updateUser(
      parseInt(req.params.id),
      req.body,
      req.user.userId,
    );

    ResponseUtil.success(res, user, "User updated successfully");
  });

  /**
   * Delete user
   * DELETE /api/v1/admin/users/:id
   */
  deleteUser = asyncHandler(async (req, res) => {
    await AdminService.deleteUser(parseInt(req.params.id), req.user.userId);

    ResponseUtil.success(res, null, "User deleted successfully");
  });

  /**
   * Get all events (admin view)
   * GET /api/v1/admin/events
   */
  getEvents = asyncHandler(async (req, res) => {
    const result = await AdminService.getEvents(req.query);

    ResponseUtil.paginated(
      res,
      result.events,
      result.pagination.page,
      result.pagination.limit,
      result.pagination.total,
      "Events retrieved successfully",
    );
  });

  /**
   * Update event featured status
   * PUT /api/v1/admin/events/:id/featured
   */
  updateEventFeaturedStatus = asyncHandler(async (req, res) => {
    const event = await AdminService.updateEventFeaturedStatus(
      parseInt(req.params.id),
      req.body.isFeatured,
      req.user.userId,
    );

    ResponseUtil.success(
      res,
      event,
      "Event featured status updated successfully",
    );
  });

  /**
   * Delete event
   * DELETE /api/v1/admin/events/:id
   */
  deleteEvent = asyncHandler(async (req, res) => {
    await AdminService.deleteEvent(parseInt(req.params.id), req.user.userId);

    ResponseUtil.success(res, null, "Event deleted successfully");
  });

  /**
   * Admin update event
   * PUT /api/v1/admin/events/:id
   */
  adminUpdateEvent = asyncHandler(async (req, res) => {
    const event = await AdminService.adminUpdateEvent(
      parseInt(req.params.id),
      req.body,
      req.user.userId
    );

    ResponseUtil.success(res, event, "Event updated successfully");
  });

  /**
   * Get all edit requests
   * GET /api/v1/admin/edit-requests
   */
  getEditRequests = asyncHandler(async (req, res) => {
    const result = await AdminService.getEditRequests(req.query);

    ResponseUtil.paginated(
      res,
      result.requests,
      result.pagination.page,
      result.pagination.limit,
      result.pagination.total,
      "Edit requests retrieved successfully",
    );
  });

  /**
   * Handle edit request (approve/reject)
   * PUT /api/v1/admin/edit-requests/:id
   */
  handleEditRequest = asyncHandler(async (req, res) => {
    const request = await AdminService.handleEditRequest(
      parseInt(req.params.id),
      req.body.status,
      req.user.userId,
    );

    ResponseUtil.success(
      res,
      request,
      req.body.status === "APPROVED"
        ? "Edit request approved. You can now edit the event."
        : "Edit request rejected",
    );
  });

  /**
   * Get participant details (admin can view any)
   * GET /api/v1/admin/participants/:id
   */
  getParticipant = asyncHandler(async (req, res) => {
    const participant = await AdminService.getParticipant(
      parseInt(req.params.id),
    );

    ResponseUtil.success(
      res,
      participant,
      "Participant retrieved successfully",
    );
  });

  /**
   * Get audit logs
   * GET /api/v1/admin/audit-logs
   */
  getAuditLogs = asyncHandler(async (req, res) => {
    const result = await AdminService.getAuditLogs(req.query);

    ResponseUtil.paginated(
      res,
      result.logs,
      result.pagination.page,
      result.pagination.limit,
      result.pagination.total,
      "Audit logs retrieved successfully",
    );
  });

  /**
   * Get all bookings (admin view)
   * GET /api/v1/admin/bookings
   */
  getBookings = asyncHandler(async (req, res) => {
    const result = await AdminService.getBookings(req.query);

    ResponseUtil.paginated(
      res,
      result.bookings,
      result.pagination.page,
      result.pagination.limit,
      result.pagination.total,
      "Bookings retrieved successfully",
    );
  });

  /**
   * Update booking status
   * PUT /api/v1/admin/bookings/:id/status
   */
  updateBookingStatus = asyncHandler(async (req, res) => {
    const { status, remarks } = req.body;

    const booking = await AdminService.updateBookingStatus(
      parseInt(req.params.id),
      status,
      remarks,
      req.user.userId,
    );

    ResponseUtil.success(res, booking, "Booking status updated successfully");
  });

  /**
   * Export bookings as CSV
   * GET /api/v1/admin/bookings/export
   */
  exportBookings = asyncHandler(async (req, res) => {
    const data = await AdminService.exportBookings(req.query);

    // Generate CSV
    if (data.length === 0) {
      return ResponseUtil.success(res, { csv: "", filename: "bookings.csv" }, "No bookings to export");
    }

    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            // Escape commas and quotes in values
            if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value ?? "";
          })
          .join(",")
      ),
    ];

    const csv = csvRows.join("\n");
    const eventId = req.query.eventId;
    const filename = eventId ? `bookings_event_${eventId}.csv` : "all_bookings.csv";

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(csv);
  });
}

module.exports = new AdminController();
