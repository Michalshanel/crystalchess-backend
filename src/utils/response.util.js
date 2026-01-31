/**
 * Response Utility
 * Standardized response formatting for API endpoints
 */

const { STATUS_CODES } = require("../config/constants");

class ResponseUtil {
  /**
   * Send success response
   * @param {object} res - Express response object
   * @param {object} data - Response data
   * @param {string} message - Success message
   * @param {number} statusCode - HTTP status code
   */
  static success(
    res,
    data = null,
    message = "Success",
    statusCode = STATUS_CODES.OK
  ) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Send created response
   * @param {object} res - Express response object
   * @param {object} data - Created resource data
   * @param {string} message - Success message
   */
  static created(res, data = null, message = "Resource created successfully") {
    return this.success(res, data, message, STATUS_CODES.CREATED);
  }

  /**
   * Send error response
   * @param {object} res - Express response object
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {array} errors - Validation errors array
   */
  static error(
    res,
    message = "Error occurred",
    statusCode = STATUS_CODES.SERVER_ERROR,
    errors = null
  ) {
    const response = {
      success: false,
      message,
      timestamp: new Date().toISOString(),
    };

    if (errors) {
      response.errors = errors;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Send validation error response
   * @param {object} res - Express response object
   * @param {array} errors - Array of validation errors
   */
  static validationError(res, errors) {
    return this.error(
      res,
      "Validation failed",
      STATUS_CODES.UNPROCESSABLE_ENTITY,
      errors
    );
  }

  /**
   * Send not found response
   * @param {object} res - Express response object
   * @param {string} message - Not found message
   */
  static notFound(res, message = "Resource not found") {
    return this.error(res, message, STATUS_CODES.NOT_FOUND);
  }

  /**
   * Send unauthorized response
   * @param {object} res - Express response object
   * @param {string} message - Unauthorized message
   */
  static unauthorized(res, message = "Unauthorized access") {
    return this.error(res, message, STATUS_CODES.UNAUTHORIZED);
  }

  /**
   * Send forbidden response
   * @param {object} res - Express response object
   * @param {string} message - Forbidden message
   */
  static forbidden(res, message = "Access forbidden") {
    return this.error(res, message, STATUS_CODES.FORBIDDEN);
  }

  /**
   * Send bad request response
   * @param {object} res - Express response object
   * @param {string} message - Bad request message
   */
  static badRequest(res, message = "Invalid request") {
    return this.error(res, message, STATUS_CODES.BAD_REQUEST);
  }

  /**
   * Send conflict response
   * @param {object} res - Express response object
   * @param {string} message - Conflict message
   */
  static conflict(res, message = "Resource conflict") {
    return this.error(res, message, STATUS_CODES.CONFLICT);
  }

  /**
   * Send pagination response
   * @param {object} res - Express response object
   * @param {array} data - Array of data
   * @param {number} page - Current page number
   * @param {number} limit - Items per page
   * @param {number} total - Total count of items
   * @param {string} message - Success message
   */
  static paginated(res, data, page, limit, total, message = "Success") {
    const totalPages = Math.ceil(total / limit);

    return res.status(STATUS_CODES.OK).json({
      success: true,
      message,
      data,
      pagination: {
        currentPage: page,
        perPage: limit,
        totalPages,
        totalItems: total,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      timestamp: new Date().toISOString(),
    });
  }
}

module.exports = ResponseUtil;
