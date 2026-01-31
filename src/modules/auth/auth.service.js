/**
 * Auth Service
 * Business logic for authentication operations
 */

const { prisma } = require("../../config/database");
const HashUtil = require("../../utils/hash.util");
const TokenUtil = require("../../utils/token.util");
const DateUtil = require("../../utils/date.util");
const EmailService = require("../notifications/email.service");
const { USER_TYPES, USER_STATUS, MESSAGES } = require("../../config/constants");
const config = require("../../config/environment");
const { OAuth2Client } = require("google-auth-library");

class AuthService {
  /**
   * Register new player
   * @param {object} userData - User registration data
   * @returns {Promise<object>} Created user and tokens
   */
  async registerPlayer(userData) {
    const { email, password, fullName, phone } = userData;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error(MESSAGES.EMAIL_ALREADY_EXISTS);
    }

    // Hash password
    const passwordHash = await HashUtil.hashPassword(password);

    // Generate email verification token
    const verificationToken = TokenUtil.generateRandomToken();
    const hashedToken = TokenUtil.hashToken(verificationToken);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        phone,
        userType: USER_TYPES.PLAYER,
        userStatus: USER_STATUS.ACTIVE,
        emailVerified: false,
      },
    });

    // Store verification token in sessions table temporarily
    await prisma.session.create({
      data: {
        sessionId: hashedToken,
        userId: user.userId,
        sessionData: JSON.stringify({ type: "email_verification" }),
        lastActivity: DateUtil.addHours(new Date(), 24), // 24 hours expiry
      },
    });

    // Send verification email
    await EmailService.sendWelcomeEmail(user, verificationToken);

    // Generate JWT tokens
    const tokens = TokenUtil.generateTokenPair(user);

    return {
      user: {
        userId: user.userId,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        userType: user.userType,
        emailVerified: user.emailVerified,
      },
      tokens,
    };
  }

  /**
   * Register new organizer (pending approval)
   * @param {object} userData - Organizer registration data
   * @returns {Promise<object>} Created user and tokens
   */
  async registerOrganizer(userData) {
    const { email, password, fullName, phone } = userData;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error(MESSAGES.EMAIL_ALREADY_EXISTS);
    }

    // Hash password
    const passwordHash = await HashUtil.hashPassword(password);

    // Generate email verification token
    const verificationToken = TokenUtil.generateRandomToken();
    const hashedToken = TokenUtil.hashToken(verificationToken);

    // Create organizer user (not approved yet)
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        phone,
        userType: USER_TYPES.ORGANIZER,
        userStatus: USER_STATUS.ACTIVE,
        emailVerified: false,
        organizerApproved: false, // Needs admin approval
      },
    });

    // Store verification token
    await prisma.session.create({
      data: {
        sessionId: hashedToken,
        userId: user.userId,
        sessionData: JSON.stringify({ type: "email_verification" }),
        lastActivity: DateUtil.addHours(new Date(), 24),
      },
    });

    // Send verification email
    await EmailService.sendWelcomeEmail(user, verificationToken);

    // Generate JWT tokens
    const tokens = TokenUtil.generateTokenPair(user);

    return {
      user: {
        userId: user.userId,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        userType: user.userType,
        emailVerified: user.emailVerified,
        organizerApproved: user.organizerApproved,
      },
      tokens,
    };
  }

  /**
   * Google OAuth authentication
   * @param {string} token - Google ID token
   * @param {string} userType - User type (player/organizer) - only used for new users
   * @returns {Promise<object>} User and tokens
   */
  async googleAuth(token, userType = "player") {
    let email, name, picture;

    // Verify the token properly using Google Auth Library if client ID is configured
    if (config.google?.clientId) {
      const client = new OAuth2Client(config.google.clientId);
      try {
        const ticket = await client.verifyIdToken({
          idToken: token,
          audience: config.google.clientId,
        });
        const payload = ticket.getPayload();
        email = payload.email;
        name = payload.name;
        picture = payload.picture;
      } catch (error) {
        throw new Error("Invalid Google token");
      }
    } else {
      // Fallback: Decode the token (less secure, for development only)
      try {
        const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        email = decoded.email;
        name = decoded.name;
        picture = decoded.picture;
      } catch (error) {
        throw new Error("Invalid Google token format");
      }
    }

    if (!email) {
      throw new Error("Invalid Google token");
    }

    // Check if user exists
    let user = await prisma.user.findUnique({ where: { email } });
    let isNewUser = false;

    if (user) {
      // User exists - update last login and return tokens
      user = await prisma.user.update({
        where: { userId: user.userId },
        data: {
          lastLogin: new Date(),
          emailVerified: true, // Google verified email
          profilePicture: picture || user.profilePicture,
        },
      });
    } else {
      // Create new user with Google account
      isNewUser = true;
      const selectedUserType = userType === "organizer" ? USER_TYPES.ORGANIZER : USER_TYPES.PLAYER;

      user = await prisma.user.create({
        data: {
          email,
          passwordHash: await HashUtil.hashPassword(TokenUtil.generateRandomToken()), // Random password
          fullName: name || email.split('@')[0],
          userType: selectedUserType,
          userStatus: USER_STATUS.ACTIVE,
          emailVerified: true, // Google verified email
          profilePicture: picture,
          organizerApproved: false, // Organizers need admin approval
        },
      });
    }

    // Generate JWT tokens
    const tokens = TokenUtil.generateTokenPair(user);

    return {
      user: {
        userId: user.userId,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        userType: user.userType,
        emailVerified: user.emailVerified,
        profilePicture: user.profilePicture,
        organizerApproved: user.organizerApproved,
      },
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      isNewUser,
    };
  }

  /**
   * Login user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<object>} User and tokens
   */
  async login(email, password) {
    // Find user by email
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new Error(MESSAGES.INVALID_CREDENTIALS);
    }

    // Verify password
    const isPasswordValid = await HashUtil.comparePassword(
      password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      throw new Error(MESSAGES.INVALID_CREDENTIALS);
    }

    // Check if account is suspended
    if (user.userStatus === USER_STATUS.SUSPENDED) {
      throw new Error(MESSAGES.ACCOUNT_SUSPENDED);
    }

    // Check if email is verified
    if (!user.emailVerified) {
      throw new Error(MESSAGES.ACCOUNT_NOT_VERIFIED);
    }

    // Update last login
    await prisma.user.update({
      where: { userId: user.userId },
      data: { lastLogin: new Date() },
    });

    // Generate JWT tokens
    const tokens = TokenUtil.generateTokenPair(user);

    return {
      user: {
        userId: user.userId,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        userType: user.userType,
        emailVerified: user.emailVerified,
        organizerApproved: user.organizerApproved,
      },
      tokens,
    };
  }

  /**
   * Verify email address
   * @param {string} token - Email verification token
   * @returns {Promise<boolean>} Success status
   */
  async verifyEmail(token) {
    const hashedToken = TokenUtil.hashToken(token);

    // Find session with token
    const session = await prisma.session.findUnique({
      where: { sessionId: hashedToken },
      include: { user: true },
    });

    if (!session) {
      throw new Error("Invalid or expired verification token");
    }

    // Check if token expired (24 hours)
    if (new Date() > session.lastActivity) {
      await prisma.session.delete({ where: { sessionId: hashedToken } });
      throw new Error("Verification token has expired");
    }

    // Update user email verification status
    await prisma.user.update({
      where: { userId: session.userId },
      data: { emailVerified: true },
    });

    // Delete verification session
    await prisma.session.delete({ where: { sessionId: hashedToken } });

    return true;
  }

  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {Promise<boolean>} Success status
   */
  async forgotPassword(email) {
    // Find user by email
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Don't reveal if email exists or not (security best practice)
      return true;
    }

    // Generate password reset token
    const resetToken = TokenUtil.generateRandomToken();
    const hashedToken = TokenUtil.hashToken(resetToken);

    // Store reset token in database
    await prisma.passwordReset.create({
      data: {
        userId: user.userId,
        token: hashedToken,
        expiresAt: DateUtil.addHours(new Date(), 1), // 1 hour expiry
      },
    });

    // Send password reset email
    await EmailService.sendPasswordResetEmail(user, resetToken);

    return true;
  }

  /**
   * Reset password using token
   * @param {string} token - Password reset token
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} Success status
   */
  async resetPassword(token, newPassword) {
    const hashedToken = TokenUtil.hashToken(token);

    // Find password reset record
    const resetRecord = await prisma.passwordReset.findUnique({
      where: { token: hashedToken },
      include: { user: true },
    });

    if (!resetRecord) {
      throw new Error("Invalid or expired reset token");
    }

    // Check if token expired
    if (new Date() > resetRecord.expiresAt) {
      await prisma.passwordReset.delete({
        where: { resetId: resetRecord.resetId },
      });
      throw new Error("Reset token has expired");
    }

    // Hash new password
    const passwordHash = await HashUtil.hashPassword(newPassword);

    // Update user password
    await prisma.user.update({
      where: { userId: resetRecord.userId },
      data: { passwordHash },
    });

    // Delete all password reset records for this user
    await prisma.passwordReset.deleteMany({
      where: { userId: resetRecord.userId },
    });

    return true;
  }

  /**
   * Change password for authenticated user
   * @param {number} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} Success status
   */
  async changePassword(userId, currentPassword, newPassword) {
    // Get user
    const user = await prisma.user.findUnique({
      where: { userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Verify current password
    const isPasswordValid = await HashUtil.comparePassword(
      currentPassword,
      user.passwordHash
    );

    if (!isPasswordValid) {
      throw new Error("Current password is incorrect");
    }

    // Hash new password
    const passwordHash = await HashUtil.hashPassword(newPassword);

    // Update user password
    await prisma.user.update({
      where: { userId },
      data: { passwordHash },
    });

    return true;
  }

  /**
   * Refresh access token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<object>} New tokens
   */
  async refreshToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = TokenUtil.verifyRefreshToken(refreshToken);

      // Get user
      const user = await prisma.user.findUnique({
        where: { userId: decoded.userId },
      });

      if (!user) {
        throw new Error("User not found");
      }

      // Generate new token pair
      const tokens = TokenUtil.generateTokenPair(user);

      return tokens;
    } catch (error) {
      throw new Error("Invalid refresh token");
    }
  }

  /**
   * Resend verification email
   * @param {string} email - User email
   * @returns {Promise<boolean>} Success status
   */
  async resendVerificationEmail(email) {
    // Find user
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new Error("User not found");
    }

    if (user.emailVerified) {
      throw new Error("Email already verified");
    }

    // Generate new verification token
    const verificationToken = TokenUtil.generateRandomToken();
    const hashedToken = TokenUtil.hashToken(verificationToken);

    // Delete old verification sessions
    await prisma.session.deleteMany({
      where: {
        userId: user.userId,
        sessionData: { contains: "email_verification" },
      },
    });

    // Create new verification session
    await prisma.session.create({
      data: {
        sessionId: hashedToken,
        userId: user.userId,
        sessionData: JSON.stringify({ type: "email_verification" }),
        lastActivity: DateUtil.addHours(new Date(), 24),
      },
    });

    // Send verification email
    await EmailService.sendWelcomeEmail(user, verificationToken);

    return true;
  }
}

module.exports = new AuthService();
