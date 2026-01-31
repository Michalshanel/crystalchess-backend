/**
 * Notification Routes
 * Define all notification-related routes
 */

const express = require("express");
const router = express.Router();
const NotificationController = require("./notification.controller");
const { authenticate, isAdmin } = require("../../middleware/auth.middleware");

/**
 * User Notification Routes
 */

/**
 * @route   GET /api/v1/notifications
 * @desc    Get user notifications
 * @access  Private
 */
router.get("/", authenticate, NotificationController.getUserNotifications);

/**
 * @route   GET /api/v1/notifications/unread-count
 * @desc    Get unread notification count
 * @access  Private
 */
router.get(
  "/unread-count",
  authenticate,
  NotificationController.getUnreadCount
);

/**
 * @route   PATCH /api/v1/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.patch("/:id/read", authenticate, NotificationController.markAsRead);

/**
 * Flash News Routes
 */

/**
 * @route   GET /api/v1/notifications/flash-news/active
 * @desc    Get active flash news (public)
 * @access  Public
 */
router.get("/flash-news/active", NotificationController.getActiveFlashNews);

/**
 * @route   POST /api/v1/notifications/flash-news
 * @desc    Create flash news (admin)
 * @access  Private (Admin)
 */
router.post(
  "/flash-news",
  authenticate,
  isAdmin,
  NotificationController.createFlashNews
);

/**
 * @route   GET /api/v1/notifications/flash-news
 * @desc    Get all flash news (admin)
 * @access  Private (Admin)
 */
router.get(
  "/flash-news",
  authenticate,
  isAdmin,
  NotificationController.getFlashNews
);

/**
 * @route   PUT /api/v1/notifications/flash-news/:id
 * @desc    Update flash news (admin)
 * @access  Private (Admin)
 */
router.put(
  "/flash-news/:id",
  authenticate,
  isAdmin,
  NotificationController.updateFlashNews
);

/**
 * @route   PATCH /api/v1/notifications/flash-news/:id/toggle
 * @desc    Toggle flash news active status (admin)
 * @access  Private (Admin)
 */
router.patch(
  "/flash-news/:id/toggle",
  authenticate,
  isAdmin,
  NotificationController.toggleFlashNewsStatus
);

/**
 * @route   DELETE /api/v1/notifications/flash-news/:id
 * @desc    Delete flash news (admin)
 * @access  Private (Admin)
 */
router.delete(
  "/flash-news/:id",
  authenticate,
  isAdmin,
  NotificationController.deleteFlashNews
);

/**
 * Email Template Routes
 */

/**
 * @route   GET /api/v1/notifications/email-templates
 * @desc    Get all email templates (admin)
 * @access  Private (Admin)
 */
router.get(
  "/email-templates",
  authenticate,
  isAdmin,
  NotificationController.getEmailTemplates
);

/**
 * @route   POST /api/v1/notifications/email-templates
 * @desc    Create email template (admin)
 * @access  Private (Admin)
 */
router.post(
  "/email-templates",
  authenticate,
  isAdmin,
  NotificationController.createEmailTemplate
);

/**
 * @route   PUT /api/v1/notifications/email-templates/:id
 * @desc    Update email template (admin)
 * @access  Private (Admin)
 */
router.put(
  "/email-templates/:id",
  authenticate,
  isAdmin,
  NotificationController.updateEmailTemplate
);

/**
 * @route   DELETE /api/v1/notifications/email-templates/:id
 * @desc    Delete email template (admin)
 * @access  Private (Admin)
 */
router.delete(
  "/email-templates/:id",
  authenticate,
  isAdmin,
  NotificationController.deleteEmailTemplate
);

module.exports = router;
