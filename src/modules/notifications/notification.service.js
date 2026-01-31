/**
 * Notification Service
 * Business logic for flash news and notification operations
 */

const { prisma } = require("../../config/database");

class NotificationService {
  /**
   * Create flash news (admin only)
   * @param {string} message - Flash news message
   * @returns {Promise<object>} Created flash news
   */
  async createFlashNews(message) {
    const flashNews = await prisma.flashNews.create({
      data: {
        message,
        isActive: true,
      },
    });

    return flashNews;
  }

  /**
   * Get all flash news
   * @param {boolean} activeOnly - Get only active flash news
   * @returns {Promise<array>} Flash news list
   */
  async getFlashNews(activeOnly = false) {
    const where = {};
    if (activeOnly) where.isActive = true;

    const flashNews = await prisma.flashNews.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return flashNews;
  }

  /**
   * Get active flash news (public)
   * @returns {Promise<array>} Active flash news
   */
  async getActiveFlashNews() {
    return this.getFlashNews(true);
  }

  /**
   * Update flash news
   * @param {number} id - Flash news ID
   * @param {object} updateData - Data to update
   * @returns {Promise<object>} Updated flash news
   */
  async updateFlashNews(id, updateData) {
    const flashNews = await prisma.flashNews.findUnique({
      where: { id },
    });

    if (!flashNews) {
      throw new Error("Flash news not found");
    }

    const updated = await prisma.flashNews.update({
      where: { id },
      data: updateData,
    });

    return updated;
  }

  /**
   * Toggle flash news active status
   * @param {number} id - Flash news ID
   * @returns {Promise<object>} Updated flash news
   */
  async toggleFlashNewsStatus(id) {
    const flashNews = await prisma.flashNews.findUnique({
      where: { id },
    });

    if (!flashNews) {
      throw new Error("Flash news not found");
    }

    const updated = await prisma.flashNews.update({
      where: { id },
      data: { isActive: !flashNews.isActive },
    });

    return updated;
  }

  /**
   * Delete flash news
   * @param {number} id - Flash news ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteFlashNews(id) {
    const flashNews = await prisma.flashNews.findUnique({
      where: { id },
    });

    if (!flashNews) {
      throw new Error("Flash news not found");
    }

    await prisma.flashNews.delete({
      where: { id },
    });

    return true;
  }

  /**
   * Get email templates (admin)
   * @returns {Promise<array>} Email templates
   */
  async getEmailTemplates() {
    const templates = await prisma.emailTemplate.findMany({
      orderBy: { templateName: "asc" },
    });

    return templates;
  }

  /**
   * Get email template by name
   * @param {string} templateName - Template name
   * @returns {Promise<object>} Email template
   */
  async getEmailTemplateByName(templateName) {
    const template = await prisma.emailTemplate.findUnique({
      where: { templateName },
    });

    if (!template) {
      throw new Error("Email template not found");
    }

    return template;
  }

  /**
   * Create email template
   * @param {object} templateData - Template data
   * @returns {Promise<object>} Created template
   */
  async createEmailTemplate(templateData) {
    const { templateName, subject, body, variables } = templateData;

    // Check if template name already exists
    const existing = await prisma.emailTemplate.findUnique({
      where: { templateName },
    });

    if (existing) {
      throw new Error("Email template with this name already exists");
    }

    const template = await prisma.emailTemplate.create({
      data: {
        templateName,
        subject,
        body,
        variables: variables || null,
      },
    });

    return template;
  }

  /**
   * Update email template
   * @param {number} templateId - Template ID
   * @param {object} updateData - Data to update
   * @returns {Promise<object>} Updated template
   */
  async updateEmailTemplate(templateId, updateData) {
    const template = await prisma.emailTemplate.findUnique({
      where: { templateId },
    });

    if (!template) {
      throw new Error("Email template not found");
    }

    const updated = await prisma.emailTemplate.update({
      where: { templateId },
      data: updateData,
    });

    return updated;
  }

  /**
   * Delete email template
   * @param {number} templateId - Template ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteEmailTemplate(templateId) {
    const template = await prisma.emailTemplate.findUnique({
      where: { templateId },
    });

    if (!template) {
      throw new Error("Email template not found");
    }

    await prisma.emailTemplate.delete({
      where: { templateId },
    });

    return true;
  }

  /**
   * Get user notifications
   * @param {number} userId - User ID
   * @param {number} limit - Number of notifications to return
   * @returns {Promise<array>} User notifications
   */
  async getUserNotifications(userId, limit = 10) {
    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { userId },
          { recipient: "ALL" },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        event: {
          select: {
            eventId: true,
            eventName: true,
          },
        },
      },
    });

    return notifications;
  }

  /**
   * Get unread notification count for user
   * @param {number} userId - User ID
   * @returns {Promise<number>} Unread count
   */
  async getUnreadCount(userId) {
    const count = await prisma.notification.count({
      where: {
        OR: [
          { userId },
          { recipient: "ALL" },
        ],
        notificationStatus: "PENDING",
      },
    });

    return count;
  }

  /**
   * Mark notification as read
   * @param {number} notificationId - Notification ID
   * @param {number} userId - User ID
   * @returns {Promise<object>} Updated notification
   */
  async markAsRead(notificationId, userId) {
    const notification = await prisma.notification.findFirst({
      where: {
        notificationId,
        OR: [
          { userId },
          { recipient: "ALL" },
        ],
      },
    });

    if (!notification) {
      throw new Error("Notification not found");
    }

    const updated = await prisma.notification.update({
      where: { notificationId },
      data: { notificationStatus: "SENT" },
    });

    return updated;
  }
}

module.exports = new NotificationService();
