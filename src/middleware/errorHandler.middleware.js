/**
 * Error Handler Middleware
 * Global error handling middleware for the application
 */

const { STATUS_CODES, MESSAGES } = require("../config/constants");
const ResponseUtil = require("../utils/response.util");

/**
 * Global error handler middleware
 * Catches all errors thrown in the application and formats response
 */
const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error("Error:", {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Prisma errors
  if (err.code) {
    return handlePrismaError(err, res);
  }

  // JWT errors
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return ResponseUtil.unauthorized(res, err.message);
  }

  // Multer file upload errors
  if (err.name === "MulterError") {
    return handleMulterError(err, res);
  }

  // Validation errors (Joi)
  if (err.isJoi) {
    const errors = err.details.map((detail) => ({
      field: detail.path.join("."),
      message: detail.message,
    }));
    return ResponseUtil.validationError(res, errors);
  }

  // Custom application errors
  if (err.statusCode) {
    return ResponseUtil.error(res, err.message, err.statusCode);
  }

  // Default server error
  return ResponseUtil.error(
    res,
    process.env.NODE_ENV === "production" ? MESSAGES.SERVER_ERROR : err.message,
    STATUS_CODES.SERVER_ERROR
  );
};

/**
 * Handle Prisma database errors
 * @param {Error} err - Prisma error object
 * @param {object} res - Express response object
 */
const handlePrismaError = (err, res) => {
  switch (err.code) {
    case "P2002": // Unique constraint violation
      const field = err.meta?.target?.[0] || "field";
      return ResponseUtil.conflict(res, `${field} already exists`);

    case "P2025": // Record not found
      return ResponseUtil.notFound(res, "Record not found");

    case "P2003": // Foreign key constraint failed
      return ResponseUtil.badRequest(
        res,
        "Invalid reference to related record"
      );

    case "P2014": // Required relation violation
      return ResponseUtil.badRequest(res, "Required relation is missing");

    default:
      return ResponseUtil.error(
        res,
        process.env.NODE_ENV === "production"
          ? "Database error occurred"
          : err.message,
        STATUS_CODES.SERVER_ERROR
      );
  }
};

/**
 * Handle Multer file upload errors
 * @param {Error} err - Multer error object
 * @param {object} res - Express response object
 */
const handleMulterError = (err, res) => {
  if (err.code === "LIMIT_FILE_SIZE") {
    return ResponseUtil.badRequest(res, "File size exceeds maximum limit");
  }

  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    return ResponseUtil.badRequest(res, "Unexpected file field");
  }

  return ResponseUtil.badRequest(res, err.message);
};

/**
 * Handle 404 Not Found errors
 * Middleware to catch all undefined routes
 */
const notFoundHandler = (req, res, next) => {
  ResponseUtil.notFound(res, `Route ${req.originalUrl} not found`);
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors and pass to error handler
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
};
