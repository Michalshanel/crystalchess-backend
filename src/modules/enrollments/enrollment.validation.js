/**
 * Enrollment Validation Schemas
 * Joi validation schemas for enrollment endpoints
 */

const Joi = require("joi");
const { ENROLLMENT_STATUS } = require("../../config/constants");

/**
 * Create enrollment schema (public - no login required)
 */
const createEnrollmentSchema = Joi.object({
  className: Joi.string().min(2).max(100).required().messages({
    "string.min": "Class name must be at least 2 characters long",
    "string.max": "Class name must not exceed 100 characters",
    "any.required": "Class name is required",
  }),
  studentName: Joi.string().min(2).max(100).required().messages({
    "string.min": "Student name must be at least 2 characters long",
    "any.required": "Student name is required",
  }),
  studentEmail: Joi.string().email().required().messages({
    "string.email": "Please provide a valid student email",
    "any.required": "Student email is required",
  }),
  studentPhone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      "string.pattern.base": "Student phone must be 10 digits",
      "any.required": "Student phone is required",
    }),
  studentAge: Joi.number().integer().min(3).max(100).required().messages({
    "number.min": "Student age must be at least 3",
    "number.max": "Student age must not exceed 100",
    "any.required": "Student age is required",
  }),
  parentName: Joi.string().min(2).max(100).optional().allow(""),
  parentPhone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .optional()
    .allow(""),
  parentEmail: Joi.string().email().optional().allow(""),
  preferredSchedule: Joi.string()
    .valid("MORNING", "AFTERNOON", "EVENING", "WEEKEND")
    .required()
    .messages({
      "any.only":
        "Invalid schedule. Choose from: MORNING, AFTERNOON, EVENING, WEEKEND",
      "any.required": "Preferred schedule is required",
    }),
  preferredDays: Joi.string().max(50).optional().allow(""),
  address: Joi.string().optional().allow(""),
  city: Joi.string().max(100).optional().allow(""),
  state: Joi.string().max(100).optional().allow(""),
  pincode: Joi.string()
    .pattern(/^[0-9]{6}$/)
    .optional()
    .allow("")
    .messages({
      "string.pattern.base": "Pincode must be 6 digits",
    }),
  previousExperience: Joi.string()
    .valid("NONE", "BEGINNER", "INTERMEDIATE", "ADVANCED")
    .optional()
    .default("NONE"),
  message: Joi.string().max(500).optional().allow(""),
});

/**
 * List enrollments query schema
 */
const listEnrollmentsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  enrollmentStatus: Joi.string()
    .valid(...Object.values(ENROLLMENT_STATUS))
    .optional(),
  search: Joi.string().optional(),
});

/**
 * Handle enrollment schema (admin approve/reject)
 */
const handleEnrollmentSchema = Joi.object({
  enrollmentStatus: Joi.string()
    .valid("APPROVED", "REJECTED")
    .required()
    .messages({
      "any.only": "Status must be APPROVED or REJECTED",
      "any.required": "Enrollment status is required",
    }),
  rejectionReason: Joi.string()
    .when("enrollmentStatus", {
      is: "REJECTED",
      then: Joi.string().min(10).max(500).optional(),
      otherwise: Joi.forbidden(),
    })
    .messages({
      "string.min": "Rejection reason must be at least 10 characters",
      "string.max": "Rejection reason must not exceed 500 characters",
    }),
  notes: Joi.string().max(500).optional().allow(""),
});

/**
 * Get enrollment by ID schema
 */
const getEnrollmentByIdSchema = Joi.object({
  enrollmentId: Joi.number().integer().positive().required().messages({
    "number.base": "Enrollment ID must be a number",
    "number.positive": "Enrollment ID must be positive",
    "any.required": "Enrollment ID is required",
  }),
});

module.exports = {
  createEnrollmentSchema,
  listEnrollmentsQuerySchema,
  handleEnrollmentSchema,
  getEnrollmentByIdSchema,
};
