/**
 * Participant Routes
 * Define all participant-related routes
 */

const express = require("express");
const router = express.Router();
const ParticipantController = require("./participant.controller");
const { validate } = require("../../middleware/validation.middleware");
const { authenticate } = require("../../middleware/auth.middleware");
const { uploadSingle } = require("../../middleware/upload.middleware");
const {
  createParticipantSchema,
  updateParticipantSchema,
  getParticipantByIdSchema,
  uploadDocumentParamsSchema,
} = require("./participant.validation");

/**
 * @route   POST /api/v1/participants
 * @desc    Create new participant
 * @access  Private
 */
router.post(
  "/",
  authenticate,
  validate(createParticipantSchema),
  ParticipantController.createParticipant
);

/**
 * @route   GET /api/v1/participants
 * @desc    Get all participants for current user
 * @access  Private
 */
router.get("/", authenticate, ParticipantController.getUserParticipants);

/**
 * @route   GET /api/v1/participants/:participantId
 * @desc    Get participant by ID
 * @access  Private
 */
router.get(
  "/:participantId",
  authenticate,
  validate(getParticipantByIdSchema, "params"),
  ParticipantController.getParticipantById
);

/**
 * @route   PUT /api/v1/participants/:participantId
 * @desc    Update participant
 * @access  Private
 */
router.put(
  "/:participantId",
  authenticate,
  validate(getParticipantByIdSchema, "params"),
  validate(updateParticipantSchema),
  ParticipantController.updateParticipant
);

/**
 * @route   DELETE /api/v1/participants/:participantId
 * @desc    Delete participant
 * @access  Private
 */
router.delete(
  "/:participantId",
  authenticate,
  validate(getParticipantByIdSchema, "params"),
  ParticipantController.deleteParticipant
);

/**
 * @route   POST /api/v1/participants/:participantId/documents/:documentType
 * @desc    Upload participant document (passportPhoto, birthCertificate, aadharCard)
 * @access  Private
 */
router.post(
  "/:participantId/documents/:documentType",
  authenticate,
  validate(uploadDocumentParamsSchema, "params"),
  uploadSingle("document"),
  ParticipantController.uploadDocument
);

/**
 * @route   GET /api/v1/participants/:participantId/bookings
 * @desc    Get participant booking history
 * @access  Private
 */
router.get(
  "/:participantId/bookings",
  authenticate,
  validate(getParticipantByIdSchema, "params"),
  ParticipantController.getParticipantBookings
);

module.exports = router;
