/**
 * File Utility
 * Helper functions for file operations
 */

const fs = require("fs");
const path = require("path");

class FileUtil {
  /**
   * Get file extension
   * @param {string} filename - File name
   * @returns {string} File extension
   */
  static getFileExtension(filename) {
    return path.extname(filename).toLowerCase();
  }

  /**
   * Check if file exists
   * @param {string} filePath - Path to file
   * @returns {boolean} True if file exists
   */
  static fileExists(filePath) {
    return fs.existsSync(filePath);
  }

  /**
   * Delete file
   * @param {string} filePath - Path to file
   * @returns {boolean} True if deleted successfully
   */
  static deleteFile(filePath) {
    try {
      if (this.fileExists(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error deleting file:", error);
      return false;
    }
  }

  /**
   * Get file size in bytes
   * @param {string} filePath - Path to file
   * @returns {number} File size in bytes
   */
  static getFileSize(filePath) {
    try {
      const stats = fs.statSync(filePath);
      return stats.size;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Format file size to human readable format
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted file size
   */
  static formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  }

  /**
   * Get file URL for serving
   * @param {string} filePath - File path from database
   * @returns {string} Public URL
   */
  static getFileUrl(filePath) {
    if (!filePath) return null;
    // Return relative path that will be served by express static
    return `/${filePath}`;
  }
}

module.exports = FileUtil;
