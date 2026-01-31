/**
 * Validation Middleware
 * Middleware to validate request data using Joi schemas
 */

const ResponseUtil = require("../utils/response.util");

/**
 * Validate request data against Joi schema
 * @param {object} schema - Joi validation schema
 * @param {string} source - Source of data to validate ('body', 'params', 'query')
 * @returns {function} Express middleware function
 */
const validate = (schema, source = "body") => {
  return (req, res, next) => {
    // Get data from specified source
    const dataToValidate = req[source];

    // Validate data against schema
    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false, // Return all errors, not just the first one
      stripUnknown: true, // Remove unknown fields
    });

    if (error) {
      // Format validation errors
      const errors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message.replace(/"/g, ""),
      }));

      return ResponseUtil.validationError(res, errors);
    }

    // Replace request data with validated and sanitized data
    req[source] = value;
    next();
  };
};

module.exports = { validate };
