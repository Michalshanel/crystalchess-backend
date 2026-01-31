/**
 * Event Routes
 * Define all event-related routes
 */

const express = require("express");
const router = express.Router();
const EventController = require("./event.controller");
const { validate } = require("../../middleware/validation.middleware");
const {
  authenticate,
  isOrganizer,
  optionalAuth,
} = require("../../middleware/auth.middleware");
const { uploadSingle } = require("../../middleware/upload.middleware");
const {
  createEventSchema,
  updateEventSchema,
  getEventByIdSchema,
  listEventsQuerySchema,
  createEditRequestSchema,
} = require("./event.validation");

/**
 * @route   POST /api/v1/events
 * @desc    Create new event (organizer only)
 * @access  Private (Organizer)
 */
router.post(
  "/",
  authenticate,
  isOrganizer,
  validate(createEventSchema),
  EventController.createEvent,
);

/**
 * @route   GET /api/v1/events
 * @desc    Get all events with filters and pagination (public)
 * @access  Public
 */
router.get(
  "/",
  validate(listEventsQuerySchema, "query"),
  EventController.getEvents,
);

/**
 * @route   GET /api/v1/events/featured
 * @desc    Get featured events for homepage (public)
 * @access  Public
 */
router.get("/featured", EventController.getFeaturedEvents);

/**
 * @route   GET /api/v1/events/categories
 * @desc    Get all event categories (public)
 * @access  Public
 */
router.get("/categories", EventController.getCategories);

/**
 * @route   GET /api/v1/events/my-events
 * @desc    Get organizer's events
 * @access  Private (Organizer)
 */
router.get(
  "/my-events",
  authenticate,
  isOrganizer,
  validate(listEventsQuerySchema, "query"),
  EventController.getOrganizerEvents,
);

/**
 * @route   GET /api/v1/events/organizer-stats
 * @desc    Get organizer statistics (events, bookings, revenue)
 * @access  Private (Organizer)
 */
router.get(
  "/organizer-stats",
  authenticate,
  isOrganizer,
  EventController.getOrganizerStatistics,
);

/**
 * @route   GET /api/v1/events/edit-requests
 * @desc    Get organizer's edit requests
 * @access  Private (Organizer)
 */
router.get(
  "/edit-requests",
  authenticate,
  isOrganizer,
  EventController.getOrganizerEditRequests,
);

/**
 * @route   GET /api/v1/events/:eventId
 * @desc    Get event by ID (public)
 * @access  Public
 */
router.get(
  "/:eventId",
  validate(getEventByIdSchema, "params"),
  EventController.getEventById,
);

/**
 * @route   PUT /api/v1/events/:eventId
 * @desc    Update event (organizer only)
 * @access  Private (Organizer)
 */
router.put(
  "/:eventId",
  authenticate,
  isOrganizer,
  validate(getEventByIdSchema, "params"),
  validate(updateEventSchema),
  EventController.updateEvent,
);

/**
 * @route   POST /api/v1/events/:eventId/image
 * @desc    Upload event image (organizer only)
 * @access  Private (Organizer)
 */
router.post(
  "/:eventId/image",
  authenticate,
  isOrganizer,
  validate(getEventByIdSchema, "params"),
  uploadSingle("eventImage"),
  EventController.uploadEventImage,
);

/**
 * @route   POST /api/v1/events/:eventId/rules
 * @desc    Upload rules PDF (organizer only)
 * @access  Private (Organizer)
 */
router.post(
  "/:eventId/rules",
  authenticate,
  isOrganizer,
  validate(getEventByIdSchema, "params"),
  uploadSingle("rulesPdf"),
  EventController.uploadRulesPdf,
);

/**
 * @route   POST /api/v1/events/:eventId/edit-request
 * @desc    Create event edit/delete request (organizer only)
 * @access  Private (Organizer)
 */
router.post(
  "/:eventId/edit-request",
  authenticate,
  isOrganizer,
  validate(getEventByIdSchema, "params"),
  validate(createEditRequestSchema),
  EventController.createEditRequest,
);

/**
 * @route   GET /api/v1/events/:eventId/participants
 * @desc    Get event participants/bookings (organizer only)
 * @access  Private (Organizer)
 */
router.get(
  "/:eventId/participants",
  authenticate,
  isOrganizer,
  validate(getEventByIdSchema, "params"),
  EventController.getEventParticipants,
);

module.exports = router;
