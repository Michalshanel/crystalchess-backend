/**
 * User Routes
 * Define all user-related routes
 */

const express = require("express");
const router = express.Router();
const UserController = require("./user.controller");
const { validate } = require("../../middleware/validation.middleware");
const { authenticate, isAdmin } = require("../../middleware/auth.middleware");
const { uploadSingle } = require("../../middleware/upload.middleware");
const { updateProfileSchema, getUserByIdSchema } = require("./user.validation");

/**
 * @route   GET /api/v1/users/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get("/profile", authenticate, UserController.getProfile);

/**
 * @route   PUT /api/v1/users/profile
 * @desc    Update current user profile
 * @access  Private
 */
router.put(
  "/profile",
  authenticate,
  validate(updateProfileSchema),
  UserController.updateProfile
);

/**
 * @route   POST /api/v1/users/profile/picture
 * @desc    Upload profile picture
 * @access  Private
 */
router.post(
  "/profile/picture",
  authenticate,
  uploadSingle("profilePicture"),
  UserController.uploadProfilePicture
);

/**
 * @route   GET /api/v1/users/statistics
 * @desc    Get user statistics (bookings, participants, etc)
 * @access  Private
 */
router.get("/statistics", authenticate, UserController.getStatistics);

/**
 * @route   GET /api/v1/users/:userId
 * @desc    Get user by ID (admin only)
 * @access  Private (Admin)
 */
router.get(
  "/:userId",
  authenticate,
  isAdmin,
  validate(getUserByIdSchema, "params"),
  UserController.getUserById
);

module.exports = router;
