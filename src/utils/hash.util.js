/**
 * Hash Utility
 * Password hashing and verification utilities using bcrypt
 */

const bcrypt = require("bcryptjs");

class HashUtil {
  /**
   * Hash password using bcrypt
   * @param {string} password - Plain text password
   * @param {number} saltRounds - Number of salt rounds (default: 12)
   * @returns {Promise<string>} Hashed password
   */
  static async hashPassword(password, saltRounds = 12) {
    try {
      const salt = await bcrypt.genSalt(saltRounds);
      return await bcrypt.hash(password, salt);
    } catch (error) {
      throw new Error("Error hashing password");
    }
  }

  /**
   * Compare password with hashed password
   * @param {string} password - Plain text password
   * @param {string} hashedPassword - Hashed password from database
   * @returns {Promise<boolean>} True if passwords match, false otherwise
   */
  static async comparePassword(password, hashedPassword) {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      throw new Error("Error comparing passwords");
    }
  }

  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @returns {object} Validation result with isValid and messages
   */
  static validatePasswordStrength(password) {
    const errors = [];

    // Minimum length check
    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long");
    }

    // Maximum length check
    if (password.length > 128) {
      errors.push("Password must not exceed 128 characters");
    }

    // Contains uppercase letter
    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }

    // Contains lowercase letter
    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }

    // Contains number
    if (!/\d/.test(password)) {
      errors.push("Password must contain at least one number");
    }

    // Contains special character
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push("Password must contain at least one special character");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

module.exports = HashUtil;
