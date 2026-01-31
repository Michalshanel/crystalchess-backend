/**
 * Auth Controller
 * Handles HTTP requests for authentication endpoints
 */

const AuthService = require("./auth.service");
const ResponseUtil = require("../../utils/response.util");
const { MESSAGES } = require("../../config/constants");
const { asyncHandler } = require("../../middleware/errorHandler.middleware");

class AuthController {
  /**
   * Register new player
   * POST /api/v1/auth/register/player
   */
  registerPlayer = asyncHandler(async (req, res) => {
    const result = await AuthService.registerPlayer(req.body);

    ResponseUtil.created(res, result, MESSAGES.REGISTER_SUCCESS);
  });

  /**
   * Register new organizer
   * POST /api/v1/auth/register/organizer
   */
  registerOrganizer = asyncHandler(async (req, res) => {
    const result = await AuthService.registerOrganizer(req.body);

    ResponseUtil.created(
      res,
      result,
      MESSAGES.REGISTER_SUCCESS + " Your account is pending admin approval."
    );
  });

  /**
   * Login user
   * POST /api/v1/auth/login
   */
  login = asyncHandler(async (req, res) => {
    const result = await AuthService.login(req.body.email, req.body.password);

    ResponseUtil.success(res, result, MESSAGES.LOGIN_SUCCESS);
  });

  /**
   * Google OAuth login
   * POST /api/v1/auth/google
   * @body {string} token - Google ID token
   * @body {string} userType - "player" or "organizer" (for new users only)
   */
  googleAuth = asyncHandler(async (req, res) => {
    const { token, userType } = req.body;
    const result = await AuthService.googleAuth(token, userType);

    ResponseUtil.success(res, result, MESSAGES.LOGIN_SUCCESS);
  });

  /**
   * Verify email address
   * POST /api/v1/auth/verify-email
   */
  verifyEmail = asyncHandler(async (req, res) => {
    await AuthService.verifyEmail(req.body.token);

    ResponseUtil.success(res, null, MESSAGES.EMAIL_VERIFIED);
  });

  /**
   * Request password reset
   * POST /api/v1/auth/forgot-password
   */
  forgotPassword = asyncHandler(async (req, res) => {
    await AuthService.forgotPassword(req.body.email);

    ResponseUtil.success(res, null, MESSAGES.PASSWORD_RESET_SENT);
  });

  /**
   * Reset password with token
   * POST /api/v1/auth/reset-password
   */
  resetPassword = asyncHandler(async (req, res) => {
    const { token, password } = req.body;
    await AuthService.resetPassword(token, password);

    ResponseUtil.success(res, null, MESSAGES.PASSWORD_RESET_SUCCESS);
  });

  /**
   * Change password for authenticated user
   * POST /api/v1/auth/change-password
   */
  changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    await AuthService.changePassword(
      req.user.userId,
      currentPassword,
      newPassword
    );

    ResponseUtil.success(res, null, "Password changed successfully");
  });

  /**
   * Refresh access token
   * POST /api/v1/auth/refresh-token
   */
  refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    const tokens = await AuthService.refreshToken(refreshToken);

    ResponseUtil.success(res, tokens, "Token refreshed successfully");
  });

  /**
   * Resend verification email
   * POST /api/v1/auth/resend-verification
   */
  resendVerification = asyncHandler(async (req, res) => {
    await AuthService.resendVerificationEmail(req.body.email);

    ResponseUtil.success(res, null, "Verification email sent successfully");
  });

  /**
   * Get current user profile
   * GET /api/v1/auth/me
   */
  getCurrentUser = asyncHandler(async (req, res) => {
    const user = {
      userId: req.user.userId,
      email: req.user.email,
      fullName: req.user.fullName,
      userType: req.user.userType,
      emailVerified: req.user.emailVerified,
      organizerApproved: req.user.organizerApproved,
    };

    ResponseUtil.success(res, user, "User profile retrieved successfully");
  });

  /**
   * Logout user (client-side token deletion)
   * POST /api/v1/auth/logout
   */
  logout = asyncHandler(async (req, res) => {
    // In JWT-based authentication, logout is handled client-side by deleting the token
    // This endpoint is here for consistency and can be used for additional cleanup

    ResponseUtil.success(res, null, MESSAGES.LOGOUT_SUCCESS);
  });
}

module.exports = new AuthController();
