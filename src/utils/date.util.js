/**
 * Date Utility
 * Date formatting and manipulation utilities
 */

class DateUtil {
  /**
   * Format date to YYYY-MM-DD
   * @param {Date} date - Date object
   * @returns {string} Formatted date string
   */
  static formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  /**
   * Format date to DD/MM/YYYY
   * @param {Date} date - Date object
   * @returns {string} Formatted date string
   */
  static formatDateDDMMYYYY(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  /**
   * Format datetime to readable string
   * @param {Date} date - Date object
   * @returns {string} Formatted datetime string
   */
  static formatDateTime(date) {
    return new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Kolkata",
    });
  }

  /**
   * Add days to date
   * @param {Date} date - Base date
   * @param {number} days - Number of days to add
   * @returns {Date} New date object
   */
  static addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * Add hours to date
   * @param {Date} date - Base date
   * @param {number} hours - Number of hours to add
   * @returns {Date} New date object
   */
  static addHours(date, hours) {
    const result = new Date(date);
    result.setHours(result.getHours() + hours);
    return result;
  }

  /**
   * Calculate age from date of birth
   * @param {Date} dateOfBirth - Date of birth
   * @returns {number} Age in years
   */
  static calculateAge(dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  }

  /**
   * Check if date is in the past
   * @param {Date} date - Date to check
   * @returns {boolean} True if date is in the past
   */
  static isPast(date) {
    return new Date(date) < new Date();
  }

  /**
   * Check if date is in the future
   * @param {Date} date - Date to check
   * @returns {boolean} True if date is in the future
   */
  static isFuture(date) {
    return new Date(date) > new Date();
  }

  /**
   * Check if date is today
   * @param {Date} date - Date to check
   * @returns {boolean} True if date is today
   */
  static isToday(date) {
    const d = new Date(date);
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  }

  /**
   * Get start of day
   * @param {Date} date - Date object
   * @returns {Date} Date at 00:00:00
   */
  static startOfDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * Get end of day
   * @param {Date} date - Date object
   * @returns {Date} Date at 23:59:59
   */
  static endOfDay(date) {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  /**
   * Parse JSON date array from database
   * @param {string} jsonDates - JSON string of dates
   * @returns {Array} Array of parsed dates
   */
  static parseEventDates(jsonDates) {
    try {
      return JSON.parse(jsonDates);
    } catch (error) {
      return [];
    }
  }

  /**
   * Format time to HH:mm
   * @param {Date|string} time - Time value (Date object or string)
   * @returns {string} Formatted time in HH:mm format
   */
  static formatTime(time) {
    if (!time) return "";

    // If it's a Date object (from Prisma Time type)
    if (time instanceof Date) {
      const hours = String(time.getUTCHours()).padStart(2, '0');
      const minutes = String(time.getUTCMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    }

    // If it's already a string in HH:mm or HH:mm:ss format
    const timeStr = String(time);
    if (timeStr.includes(':')) {
      return timeStr.substring(0, 5);
    }

    return timeStr;
  }
}

module.exports = DateUtil;
