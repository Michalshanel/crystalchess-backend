/**
 * User Controller
 * Handles HTTP requests for user endpoints
 */

const UserService = require("./user.service");
const ResponseUtil = require("../../utils/response.util");
const { asyncHandler } = require("../../middleware/errorHandler.middleware");

class UserController {
  /**
   * Get current user profile
   * GET /api/v1/users/profile
   */
  getProfile = asyncHandler(async (req, res) => {
    const user = await UserService.getUserProfile(req.user.userId);

    ResponseUtil.success(res, user, "Profile retrieved successfully");
  });

  /**
   * Update current user profile
   * PUT /api/v1/users/profile
   */
  updateProfile = asyncHandler(async (req, res) => {
    const user = await UserService.updateProfile(req.user.userId, req.body);

    ResponseUtil.success(res, user, "Profile updated successfully");
  });

  /**
   * Upload profile picture
   * POST /api/v1/users/profile/picture
   */
  uploadProfilePicture = asyncHandler(async (req, res) => {
    if (!req.file) {
      return ResponseUtil.badRequest(res, "No file uploaded");
    }

    const user = await UserService.uploadProfilePicture(
      req.user.userId,
      req.file.path
    );

    ResponseUtil.success(res, user, "Profile picture uploaded successfully");
  });

  /**
   * Get user statistics
   * GET /api/v1/users/statistics
   */
  getStatistics = asyncHandler(async (req, res) => {
    const statistics = await UserService.getUserStatistics(req.user.userId);

    ResponseUtil.success(res, statistics, "Statistics retrieved successfully");
  });

  /**
   * Get user by ID (admin only)
   * GET /api/v1/users/:userId
   */
  getUserById = asyncHandler(async (req, res) => {
    const user = await UserService.getUserProfile(parseInt(req.params.userId));

    ResponseUtil.success(res, user, "User retrieved successfully");
  });
}

module.exports = new UserController();
