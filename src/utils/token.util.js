/**
 * Token Utility
 * JWT token generation and verification utilities
 */

const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const config = require("../config/environment");

class TokenUtil {
  /**
   * Generate JWT access token
   * @param {object} payload - Token payload (user data)
   * @returns {string} JWT token
   */
  static generateAccessToken(payload) {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });
  }

  /**
   * Generate JWT refresh token
   * @param {object} payload - Token payload (user data)
   * @returns {string} Refresh token
   */
  static generateRefreshToken(payload) {
    return jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn,
    });
  }

  /**
   * Verify JWT access token
   * @param {string} token - JWT token to verify
   * @returns {object} Decoded token payload
   * @throws {Error} If token is invalid or expired
   */
  static verifyAccessToken(token) {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        throw new Error("Token has expired");
      }
      if (error.name === "JsonWebTokenError") {
        throw new Error("Invalid token");
      }
      throw error;
    }
  }

  /**
   * Verify JWT refresh token
   * @param {string} token - Refresh token to verify
   * @returns {object} Decoded token payload
   * @throws {Error} If token is invalid or expired
   */
  static verifyRefreshToken(token) {
    try {
      return jwt.verify(token, config.jwt.refreshSecret);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        throw new Error("Refresh token has expired");
      }
      if (error.name === "JsonWebTokenError") {
        throw new Error("Invalid refresh token");
      }
      throw error;
    }
  }

  /**
   * Generate random token for email verification or password reset
   * @param {number} length - Token length (default: 32)
   * @returns {string} Random hex token
   */
  static generateRandomToken(length = 32) {
    return crypto.randomBytes(length).toString("hex");
  }

  /**
   * Hash token for secure storage
   * @param {string} token - Token to hash
   * @returns {string} Hashed token
   */
  static hashToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  /**
   * Generate token payload from user object
   * @param {object} user - User object from database
   * @returns {object} Token payload
   */
  static generatePayload(user) {
    return {
      userId: user.userId,
      email: user.email,
      userType: user.userType,
      fullName: user.fullName,
    };
  }

  /**
   * Generate both access and refresh tokens
   * @param {object} user - User object
   * @returns {object} Object containing both tokens
   */
  static generateTokenPair(user) {
    const payload = this.generatePayload(user);

    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }

  /**
   * Extract token from authorization header
   * @param {string} authHeader - Authorization header value
   * @returns {string|null} Extracted token or null
   */
  static extractTokenFromHeader(authHeader) {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }
    return authHeader.substring(7); // Remove 'Bearer ' prefix
  }
}

module.exports = TokenUtil;
