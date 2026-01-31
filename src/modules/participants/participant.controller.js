/**
 * Participant Controller
 * Handles HTTP requests for participant endpoints
 */

const ParticipantService = require("./participant.service");
const ResponseUtil = require("../../utils/response.util");
const { asyncHandler } = require("../../middleware/errorHandler.middleware");
const { MESSAGES } = require("../../config/constants");

class ParticipantController {
  /**
   * Create new participant
   * POST /api/v1/participants
   */
  createParticipant = asyncHandler(async (req, res) => {
    const participant = await ParticipantService.createParticipant(
      req.user.userId,
      req.body
    );

    ResponseUtil.created(res, participant, "Participant created successfully");
  });

  /**
   * Get all participants for current user
   * GET /api/v1/participants
   */
  getUserParticipants = asyncHandler(async (req, res) => {
    const participants = await ParticipantService.getUserParticipants(
      req.user.userId
    );

    ResponseUtil.success(
      res,
      participants,
      "Participants retrieved successfully"
    );
  });

  /**
   * Get participant by ID
   * GET /api/v1/participants/:participantId
   */
  getParticipantById = asyncHandler(async (req, res) => {
    const participant = await ParticipantService.getParticipantById(
      parseInt(req.params.participantId),
      req.user.userId
    );

    ResponseUtil.success(
      res,
      participant,
      "Participant retrieved successfully"
    );
  });

  /**
   * Update participant
   * PUT /api/v1/participants/:participantId
   */
  updateParticipant = asyncHandler(async (req, res) => {
    const participant = await ParticipantService.updateParticipant(
      parseInt(req.params.participantId),
      req.user.userId,
      req.body
    );

    ResponseUtil.success(res, participant, "Participant updated successfully");
  });

  /**
   * Delete participant
   * DELETE /api/v1/participants/:participantId
   */
  deleteParticipant = asyncHandler(async (req, res) => {
    await ParticipantService.deleteParticipant(
      parseInt(req.params.participantId),
      req.user.userId
    );

    ResponseUtil.success(res, null, "Participant deleted successfully");
  });

  /**
   * Upload participant document
   * POST /api/v1/participants/:participantId/documents/:documentType
   */
  uploadDocument = asyncHandler(async (req, res) => {
    if (!req.file) {
      return ResponseUtil.badRequest(res, "No file uploaded");
    }

    const { participantId, documentType } = req.params;

    const participant = await ParticipantService.uploadDocument(
      parseInt(participantId),
      req.user.userId,
      documentType,
      req.file.path
    );

    ResponseUtil.success(res, participant, "Document uploaded successfully");
  });

  /**
   * Get participant booking history
   * GET /api/v1/participants/:participantId/bookings
   */
  getParticipantBookings = asyncHandler(async (req, res) => {
    const bookings = await ParticipantService.getParticipantBookings(
      parseInt(req.params.participantId),
      req.user.userId
    );

    ResponseUtil.success(
      res,
      bookings,
      "Booking history retrieved successfully"
    );
  });
}

module.exports = new ParticipantController();
