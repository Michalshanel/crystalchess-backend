/**
 * Event Controller
 * Handles HTTP requests for event endpoints
 */

const EventService = require("./event.service");
const ResponseUtil = require("../../utils/response.util");
const { asyncHandler } = require("../../middleware/errorHandler.middleware");

class EventController {
  /**
   * Create new event (organizer only)
   * POST /api/v1/events
   */
  createEvent = asyncHandler(async (req, res) => {
    const event = await EventService.createEvent(req.user.userId, req.body);

    ResponseUtil.created(res, event, "Event created successfully");
  });

  /**
   * Get all events (public)
   * GET /api/v1/events
   */
  getEvents = asyncHandler(async (req, res) => {
    const result = await EventService.getEvents(req.query);

    ResponseUtil.paginated(
      res,
      result.events,
      result.pagination.page,
      result.pagination.limit,
      result.pagination.total,
      "Events retrieved successfully"
    );
  });

  /**
   * Get featured events (public)
   * GET /api/v1/events/featured
   */
  getFeaturedEvents = asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 5;
    const events = await EventService.getFeaturedEvents(limit);

    ResponseUtil.success(res, events, "Featured events retrieved successfully");
  });

  /**
   * Get all event categories (public)
   * GET /api/v1/events/categories
   */
  getCategories = asyncHandler(async (req, res) => {
    const categories = await EventService.getCategories();

    ResponseUtil.success(res, categories, "Categories retrieved successfully");
  });

  /**
   * Get organizer's events
   * GET /api/v1/events/my-events
   */
  getOrganizerEvents = asyncHandler(async (req, res) => {
    const result = await EventService.getOrganizerEvents(
      req.user.userId,
      req.query
    );

    ResponseUtil.paginated(
      res,
      result.events,
      result.pagination.page,
      result.pagination.limit,
      result.pagination.total,
      "Events retrieved successfully"
    );
  });

  /**
   * Get organizer statistics
   * GET /api/v1/events/organizer-stats
   */
  getOrganizerStatistics = asyncHandler(async (req, res) => {
    const stats = await EventService.getOrganizerStatistics(req.user.userId);

    ResponseUtil.success(res, stats, "Statistics retrieved successfully");
  });

  /**
   * Get event by ID (public)
   * GET /api/v1/events/:eventId
   */
  getEventById = asyncHandler(async (req, res) => {
    const event = await EventService.getEventById(parseInt(req.params.eventId));

    ResponseUtil.success(res, event, "Event retrieved successfully");
  });

  /**
   * Update event (organizer only)
   * PUT /api/v1/events/:eventId
   */
  updateEvent = asyncHandler(async (req, res) => {
    const event = await EventService.updateEvent(
      parseInt(req.params.eventId),
      req.user.userId,
      req.body
    );

    ResponseUtil.success(res, event, "Event updated successfully");
  });

  /**
   * Upload event image (organizer only)
   * POST /api/v1/events/:eventId/image
   */
  uploadEventImage = asyncHandler(async (req, res) => {
    if (!req.file) {
      return ResponseUtil.badRequest(res, "No file uploaded");
    }

    const event = await EventService.uploadEventImage(
      parseInt(req.params.eventId),
      req.user.userId,
      req.file.path
    );

    ResponseUtil.success(res, event, "Event image uploaded successfully");
  });

  /**
   * Upload rules PDF (organizer only)
   * POST /api/v1/events/:eventId/rules
   */
  uploadRulesPdf = asyncHandler(async (req, res) => {
    if (!req.file) {
      return ResponseUtil.badRequest(res, "No file uploaded");
    }

    const event = await EventService.uploadRulesPdf(
      parseInt(req.params.eventId),
      req.user.userId,
      req.file.path
    );

    ResponseUtil.success(res, event, "Rules PDF uploaded successfully");
  });

  /**
   * Create event edit request (organizer only)
   * POST /api/v1/events/:eventId/edit-request
   */
  createEditRequest = asyncHandler(async (req, res) => {
    const request = await EventService.createEditRequest(
      parseInt(req.params.eventId),
      req.user.userId,
      req.body.message
    );

    ResponseUtil.created(res, request, "Edit request submitted successfully");
  });

  /**
   * Get organizer's edit requests
   * GET /api/v1/events/edit-requests
   */
  getOrganizerEditRequests = asyncHandler(async (req, res) => {
    const requests = await EventService.getOrganizerEditRequests(
      req.user.userId
    );

    ResponseUtil.success(res, requests, "Edit requests retrieved successfully");
  });

  /**
   * Get event participants (organizer only)
   * GET /api/v1/events/:eventId/participants
   */
  getEventParticipants = asyncHandler(async (req, res) => {
    const result = await EventService.getEventParticipants(
      parseInt(req.params.eventId),
      req.user.userId,
      req.query
    );

    ResponseUtil.success(res, result, "Participants retrieved successfully");
  });
}

module.exports = new EventController();
