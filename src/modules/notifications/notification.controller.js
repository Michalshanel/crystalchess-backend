/**
 * Notification Controller
 * Handles HTTP requests for notification endpoints
 */

const NotificationService = require("./notification.service");
const ResponseUtil = require("../../utils/response.util");
const { asyncHandler } = require("../../middleware/errorHandler.middleware");

class NotificationController {
  /**
   * Create flash news (admin)
   * POST /api/v1/notifications/flash-news
   */
  createFlashNews = asyncHandler(async (req, res) => {
    const flashNews = await NotificationService.createFlashNews(
      req.body.message
    );

    ResponseUtil.created(res, flashNews, "Flash news created successfully");
  });

  /**
   * Get all flash news (admin)
   * GET /api/v1/notifications/flash-news
   */
  getFlashNews = asyncHandler(async (req, res) => {
    const flashNews = await NotificationService.getFlashNews(false);

    ResponseUtil.success(res, flashNews, "Flash news retrieved successfully");
  });

  /**
   * Get active flash news (public)
   * GET /api/v1/notifications/flash-news/active
   */
  getActiveFlashNews = asyncHandler(async (req, res) => {
    const flashNews = await NotificationService.getActiveFlashNews();

    ResponseUtil.success(
      res,
      flashNews,
      "Active flash news retrieved successfully"
    );
  });

  /**
   * Update flash news (admin)
   * PUT /api/v1/notifications/flash-news/:id
   */
  updateFlashNews = asyncHandler(async (req, res) => {
    const flashNews = await NotificationService.updateFlashNews(
      parseInt(req.params.id),
      req.body
    );

    ResponseUtil.success(res, flashNews, "Flash news updated successfully");
  });

  /**
   * Toggle flash news status (admin)
   * PATCH /api/v1/notifications/flash-news/:id/toggle
   */
  toggleFlashNewsStatus = asyncHandler(async (req, res) => {
    const flashNews = await NotificationService.toggleFlashNewsStatus(
      parseInt(req.params.id)
    );

    ResponseUtil.success(
      res,
      flashNews,
      "Flash news status toggled successfully"
    );
  });

  /**
   * Delete flash news (admin)
   * DELETE /api/v1/notifications/flash-news/:id
   */
  deleteFlashNews = asyncHandler(async (req, res) => {
    await NotificationService.deleteFlashNews(parseInt(req.params.id));

    ResponseUtil.success(res, null, "Flash news deleted successfully");
  });

  /**
   * Get email templates (admin)
   * GET /api/v1/notifications/email-templates
   */
  getEmailTemplates = asyncHandler(async (req, res) => {
    const templates = await NotificationService.getEmailTemplates();

    ResponseUtil.success(
      res,
      templates,
      "Email templates retrieved successfully"
    );
  });

  /**
   * Create email template (admin)
   * POST /api/v1/notifications/email-templates
   */
  createEmailTemplate = asyncHandler(async (req, res) => {
    const template = await NotificationService.createEmailTemplate(req.body);

    ResponseUtil.created(res, template, "Email template created successfully");
  });

  /**
   * Update email template (admin)
   * PUT /api/v1/notifications/email-templates/:id
   */
  updateEmailTemplate = asyncHandler(async (req, res) => {
    const template = await NotificationService.updateEmailTemplate(
      parseInt(req.params.id),
      req.body
    );

    ResponseUtil.success(res, template, "Email template updated successfully");
  });

  /**
   * Delete email template (admin)
   * DELETE /api/v1/notifications/email-templates/:id
   */
  deleteEmailTemplate = asyncHandler(async (req, res) => {
    await NotificationService.deleteEmailTemplate(parseInt(req.params.id));

    ResponseUtil.success(res, null, "Email template deleted successfully");
  });

  /**
   * Get user notifications
   * GET /api/v1/notifications
   */
  getUserNotifications = asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const notifications = await NotificationService.getUserNotifications(
      req.user.userId,
      limit
    );

    ResponseUtil.success(
      res,
      notifications,
      "Notifications retrieved successfully"
    );
  });

  /**
   * Get unread notification count
   * GET /api/v1/notifications/unread-count
   */
  getUnreadCount = asyncHandler(async (req, res) => {
    const count = await NotificationService.getUnreadCount(req.user.userId);

    ResponseUtil.success(res, { count }, "Unread count retrieved successfully");
  });

  /**
   * Mark notification as read
   * PATCH /api/v1/notifications/:id/read
   */
  markAsRead = asyncHandler(async (req, res) => {
    const notification = await NotificationService.markAsRead(
      parseInt(req.params.id),
      req.user.userId
    );

    ResponseUtil.success(
      res,
      notification,
      "Notification marked as read successfully"
    );
  });
}

module.exports = new NotificationController();
