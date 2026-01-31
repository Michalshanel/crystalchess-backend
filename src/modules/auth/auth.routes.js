/**
 * Auth Routes
 * Define all authentication-related routes
 */

const express = require("express");
const router = express.Router();
const AuthController = require("./auth.controller");
const { validate } = require("../../middleware/validation.middleware");
const { authenticate } = require("../../middleware/auth.middleware");
const { checkRegistrationsAllowed } = require("../../middleware/settings.middleware");
const {
  registerPlayerSchema,
  registerOrganizerSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} = require("./auth.validation");

/**
 * @route   POST /api/v1/auth/register/player
 * @desc    Register new player account
 * @access  Public
 */
router.post(
  "/register/player",
  checkRegistrationsAllowed,
  validate(registerPlayerSchema),
  AuthController.registerPlayer
);

/**
 * @route   POST /api/v1/auth/register/organizer
 * @desc    Register new organizer account (requires admin approval)
 * @access  Public
 */
router.post(
  "/register/organizer",
  checkRegistrationsAllowed,
  validate(registerOrganizerSchema),
  AuthController.registerOrganizer
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user (player/organizer/admin)
 * @access  Public
 */
router.post("/login", validate(loginSchema), AuthController.login);

/**
 * @route   POST /api/v1/auth/google
 * @desc    Google OAuth login/register
 * @access  Public
 */
router.post("/google", AuthController.googleAuth);

/**
 * @route   POST /api/v1/auth/verify-email
 * @desc    Verify user email address
 * @access  Public
 */
router.post(
  "/verify-email",
  validate(verifyEmailSchema),
  AuthController.verifyEmail
);

/**
 * @route   POST /api/v1/auth/forgot-password
 * @desc    Request password reset link
 * @access  Public
 */
router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  AuthController.forgotPassword
);

/**
 * @route   POST /api/v1/auth/reset-password
 * @desc    Reset password using token
 * @access  Public
 */
router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  AuthController.resetPassword
);

/**
 * @route   POST /api/v1/auth/resend-verification
 * @desc    Resend email verification link
 * @access  Public
 */
router.post(
  "/resend-verification",
  validate(forgotPasswordSchema), // Uses email field
  AuthController.resendVerification
);

/**
 * @route   POST /api/v1/auth/refresh-token
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post("/refresh-token", AuthController.refreshToken);

/**
 * @route   POST /api/v1/auth/change-password
 * @desc    Change password for authenticated user
 * @access  Private
 */
router.post(
  "/change-password",
  authenticate,
  validate(changePasswordSchema),
  AuthController.changePassword
);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current authenticated user profile
 * @access  Private
 */
router.get("/me", authenticate, AuthController.getCurrentUser);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user (client-side token deletion)
 * @access  Private
 */
router.post("/logout", authenticate, AuthController.logout);

module.exports = router;
