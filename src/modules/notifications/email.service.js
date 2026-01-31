/**
 * Email Service
 * Service for sending emails using Nodemailer
 */

const nodemailer = require("nodemailer");
const config = require("../../config/environment");
const { prisma } = require("../../config/database");

class EmailService {
  constructor() {
    // Create nodemailer transporter
    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: {
        user: config.email.user,
        pass: config.email.password,
      },
    });
  }

  /**
   * Send email
   * @param {string} to - Recipient email address
   * @param {string} subject - Email subject
   * @param {string} html - Email HTML content
   * @param {string} text - Email plain text content (optional)
   * @returns {Promise<object>} Email send result
   */
  async sendEmail(to, subject, html, text = "") {
    try {
      const mailOptions = {
        from: config.email.from,
        to,
        subject,
        html,
        text: text || this.htmlToText(html),
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log("Email sent successfully to:", to);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error("Error sending email:", error);
      throw new Error("Failed to send email");
    }
  }

  /**
   * Send welcome email to new user
   * @param {object} user - User object
   * @param {string} verificationToken - Email verification token
   */
  async sendWelcomeEmail(user, verificationToken) {
    const verificationUrl = `${config.frontend.url}/verify-email?token=${verificationToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4a5568; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f7fafc; }
          .button { display: inline-block; padding: 12px 24px; background: #4299e1; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #718096; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to CrystalChess!</h1>
          </div>
          <div class="content">
            <h2>Hello ${user.fullName},</h2>
            <p>Thank you for registering with CrystalChess Tournament Management System.</p>
            <p>Please verify your email address by clicking the button below:</p>
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all;">${verificationUrl}</p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't create this account, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} CrystalChess. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail(
      user.email,
      "Welcome to CrystalChess - Verify Your Email",
      html
    );
  }

  /**
   * Send password reset email
   * @param {object} user - User object
   * @param {string} resetToken - Password reset token
   */
  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${config.frontend.url}/reset-password?token=${resetToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4a5568; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f7fafc; }
          .button { display: inline-block; padding: 12px 24px; background: #e53e3e; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #718096; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Hello ${user.fullName},</h2>
            <p>We received a request to reset your password for your CrystalChess account.</p>
            <p>Click the button below to reset your password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all;">${resetUrl}</p>
            <p>This link will expire in 1 hour.</p>
            <p><strong>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</strong></p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} CrystalChess. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail(user.email, "Reset Your CrystalChess Password", html);
  }

  /**
   * Send organizer approval notification
   * @param {object} user - User object
   */
  async sendOrganizerApprovalEmail(user) {
    const loginUrl = `${config.frontend.url}/login`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #48bb78; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f7fafc; }
          .button { display: inline-block; padding: 12px 24px; background: #48bb78; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #718096; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Organizer Account Approved!</h1>
          </div>
          <div class="content">
            <h2>Congratulations ${user.fullName}!</h2>
            <p>Your organizer account has been approved by the CrystalChess admin team.</p>
            <p>You can now log in and start creating and managing chess tournaments.</p>
            <a href="${loginUrl}" class="button">Login to Your Account</a>
            <p>We're excited to have you as a tournament organizer on our platform!</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} CrystalChess. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail(
      user.email,
      "Your Organizer Account Has Been Approved!",
      html
    );
  }

  /**
   * Send organizer rejection notification
   * @param {object} user - User object
   * @param {string} reason - Rejection reason
   */
  async sendOrganizerRejectionEmail(user, reason) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #e53e3e; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f7fafc; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #718096; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Organizer Application Update</h1>
          </div>
          <div class="content">
            <h2>Hello ${user.fullName},</h2>
            <p>Thank you for your interest in becoming a tournament organizer on CrystalChess.</p>
            <p>Unfortunately, we are unable to approve your organizer account at this time.</p>
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
            <p>If you have any questions or would like to reapply, please contact our support team.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} CrystalChess. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail(user.email, "Organizer Application Status", html);
  }

  /**
   * Send booking confirmation email
   * @param {object} booking - Booking object with event and participant details
   */
  async sendBookingConfirmationEmail(booking) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4299e1; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f7fafc; }
          .booking-details { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #4299e1; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #718096; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Booking Confirmed!</h1>
          </div>
          <div class="content">
            <h2>Hello ${booking.user.fullName},</h2>
            <p>Your tournament booking has been confirmed.</p>
            <div class="booking-details">
              <h3>Booking Details:</h3>
              <p><strong>Booking Reference:</strong> ${
                booking.bookingReference
              }</p>
              <p><strong>Tournament:</strong> ${booking.event.eventName}</p>
              <p><strong>Location:</strong> ${booking.event.location}</p>
              <p><strong>Amount Paid:</strong> ₹${booking.amountPaid}</p>
              <p><strong>Participants:</strong> ${
                booking.participants.length
              }</p>
            </div>
            <p>We look forward to seeing you at the tournament!</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} CrystalChess. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail(
      booking.user.email,
      "Tournament Booking Confirmed",
      html
    );
  }

  /**
   * Send enrollment received notification to admin
   * @param {object} enrollment - Enrollment object
   */
  async sendEnrollmentNotificationToAdmin(enrollment) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4a5568; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f7fafc; }
          .enrollment-details { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #4299e1; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #718096; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Class Enrollment</h1>
          </div>
          <div class="content">
            <h2>New enrollment received!</h2>
            <div class="enrollment-details">
              <p><strong>Student Name:</strong> ${enrollment.studentName}</p>
              <p><strong>Class:</strong> ${enrollment.className}</p>
              <p><strong>Age:</strong> ${enrollment.studentAge}</p>
              <p><strong>Email:</strong> ${enrollment.studentEmail}</p>
              <p><strong>Phone:</strong> ${enrollment.studentPhone}</p>
              <p><strong>Preferred Schedule:</strong> ${
                enrollment.preferredSchedule
              }</p>
            </div>
            <p>Please review and approve this enrollment in the admin dashboard.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} CrystalChess. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await this.sendEmail(
      config.admin.email,
      "New Class Enrollment Received",
      html
    );
  }

  /**
   * Convert HTML to plain text (basic implementation)
   * @param {string} html - HTML content
   * @returns {string} Plain text
   */
  htmlToText(html) {
    return html
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }
}

module.exports = new EmailService();
