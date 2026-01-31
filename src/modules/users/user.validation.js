/**
 * User Validation Schemas
 * Joi validation schemas for user endpoints
 */

const Joi = require("joi");

/**
 * Update user profile schema
 */
const updateProfileSchema = Joi.object({
  fullName: Joi.string().min(2).max(100).optional().messages({
    "string.min": "Full name must be at least 2 characters long",
    "string.max": "Full name must not exceed 100 characters",
  }),
  phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .optional()
    .messages({
      "string.pattern.base": "Phone number must be 10 digits",
    }),
});

/**
 * Get user by ID schema (params)
 */
const getUserByIdSchema = Joi.object({
  userId: Joi.number().integer().positive().required().messages({
    "number.base": "User ID must be a number",
    "number.positive": "User ID must be positive",
    "any.required": "User ID is required",
  }),
});

module.exports = {
  updateProfileSchema,
  getUserByIdSchema,
};
