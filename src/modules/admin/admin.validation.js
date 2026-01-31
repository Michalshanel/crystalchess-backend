/**
 * Admin Validation Schemas
 * Joi validation schemas for admin endpoints
 */

const Joi = require("joi");
const {
  USER_TYPES,
  USER_STATUS,
  REQUEST_STATUS,
} = require("../../config/constants");

/**
 * List users query schema
 */
const listUsersQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  userType: Joi.string()
    .valid(...Object.values(USER_TYPES))
    .optional(),
  userStatus: Joi.string()
    .valid(...Object.values(USER_STATUS))
    .optional(),
  search: Joi.string().min(1).optional().allow(""), // ✅ FIXED: Allow empty string
  organizerApproved: Joi.boolean().optional(),
  eventStatus: Joi.string().optional().allow(""), // ✅ ADD: For events filtering
  eventType: Joi.string().optional().allow(""), // ✅ ADD: For events filtering
  //isFeatured: Joi.boolean().optional(),
  status: Joi.string().optional().allow(""), // ✅ ADD: For edit requests
});

/**
 * Update user status schema
 */
const updateUserStatusSchema = Joi.object({
  userStatus: Joi.string()
    .valid(...Object.values(USER_STATUS))
    .required()
    .messages({
      "any.only": "Invalid user status",
      "any.required": "User status is required",
    }),
});

/**
 * Update user details schema
 */
const updateUserSchema = Joi.object({
  fullName: Joi.string().min(2).max(100).optional(),
  phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .optional(),
  userType: Joi.string()
    .valid(...Object.values(USER_TYPES))
    .optional(),
  userStatus: Joi.string()
    .valid(...Object.values(USER_STATUS))
    .optional(),
});

/**
 * Approve/Reject organizer schema
 */
const organizerApprovalSchema = Joi.object({
  approved: Joi.boolean().required().messages({
    "any.required": "Approval status is required",
  }),
  rejectionReason: Joi.string()
    .when("approved", {
      is: false,
      then: Joi.string().min(10).max(500).optional(),
      otherwise: Joi.forbidden(),
    })
    .messages({
      "string.min": "Rejection reason must be at least 10 characters",
      "string.max": "Rejection reason must not exceed 500 characters",
    }),
});

/**
 * Handle edit request schema
 */
const handleEditRequestSchema = Joi.object({
  status: Joi.string().valid("APPROVED", "REJECTED").required().messages({
    "any.only": "Status must be APPROVED or REJECTED",
    "any.required": "Status is required",
  }),
});

/**
 * Update featured status schema
 */
const updateFeaturedStatusSchema = Joi.object({
  isFeatured: Joi.boolean().required().messages({
    "any.required": "Featured status is required",
  }),
});

/**
 * Create user (admin) schema
 */
const createUserSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email address",
    "any.required": "Email is required",
  }),
  password: Joi.string().min(8).max(128).required().messages({
    "string.min": "Password must be at least 8 characters long",
    "any.required": "Password is required",
  }),
  fullName: Joi.string().min(2).max(100).required().messages({
    "string.min": "Full name must be at least 2 characters long",
    "any.required": "Full name is required",
  }),
  phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      "string.pattern.base": "Phone number must be 10 digits",
      "any.required": "Phone number is required",
    }),
  userType: Joi.string()
    .valid(...Object.values(USER_TYPES))
    .required()
    .messages({
      "any.only": "Invalid user type",
      "any.required": "User type is required",
    }),
});

/**
 * Get user/event by ID schema
 */
const getByIdSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    "number.base": "ID must be a number",
    "number.positive": "ID must be positive",
    "any.required": "ID is required",
  }),
});

module.exports = {
  listUsersQuerySchema,
  updateUserStatusSchema,
  organizerApprovalSchema,
  updateUserSchema,
  handleEditRequestSchema,
  updateFeaturedStatusSchema,
  createUserSchema,
  getByIdSchema,
};
