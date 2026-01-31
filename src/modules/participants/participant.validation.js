/**
 * Participant Validation Schemas
 * Joi validation schemas for participant endpoints
 */

const Joi = require("joi");
const { GENDER, EVENT_TYPES } = require("../../config/constants");

/**
 * Create participant schema
 */
const createParticipantSchema = Joi.object({
  fullName: Joi.string().min(2).max(100).required().messages({
    "string.min": "Full name must be at least 2 characters long",
    "string.max": "Full name must not exceed 100 characters",
    "any.required": "Full name is required",
  }),
  dateOfBirth: Joi.date().max("now").required().messages({
    "date.base": "Please provide a valid date of birth",
    "date.max": "Date of birth cannot be in the future",
    "any.required": "Date of birth is required",
  }),
  gender: Joi.string()
    .valid(...Object.values(GENDER))
    .required()
    .messages({
      "any.only": "Gender must be MALE, FEMALE, or OTHERS",
      "any.required": "Gender is required",
    }),
  eventRated: Joi.string()
    .valid(...Object.values(EVENT_TYPES))
    .optional()
    .allow("")
    .messages({
      "any.only": "Event rated must be FIDE_RATED, STATE_LEVEL, DISTRICT_LEVEL, INTER_SCHOOL_LEVEL, or COLLEGE_LEVEL",
    }),
  contactNumber: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .optional()
    .allow("")
    .messages({
      "string.pattern.base": "Contact number must be 10 digits",
    }),
  email: Joi.string().email().optional().allow("").messages({
    "string.email": "Please provide a valid email address",
  }),
  fideId: Joi.string().max(50).optional().allow("").messages({
    "string.max": "FIDE ID must not exceed 50 characters",
  }),
});

/**
 * Update participant schema
 */
const updateParticipantSchema = Joi.object({
  fullName: Joi.string().min(2).max(100).optional().messages({
    "string.min": "Full name must be at least 2 characters long",
    "string.max": "Full name must not exceed 100 characters",
  }),
  dateOfBirth: Joi.date().max("now").optional().messages({
    "date.base": "Please provide a valid date of birth",
    "date.max": "Date of birth cannot be in the future",
  }),
  gender: Joi.string()
    .valid(...Object.values(GENDER))
    .optional()
    .messages({
      "any.only": "Gender must be MALE, FEMALE, or OTHERS",
    }),
  eventRated: Joi.string()
    .valid(...Object.values(EVENT_TYPES))
    .optional()
    .allow("")
    .messages({
      "any.only": "Event rated must be FIDE_RATED, STATE_LEVEL, DISTRICT_LEVEL, INTER_SCHOOL_LEVEL, or COLLEGE_LEVEL",
    }),
  contactNumber: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .optional()
    .allow("")
    .messages({
      "string.pattern.base": "Contact number must be 10 digits",
    }),
  email: Joi.string().email().optional().allow("").messages({
    "string.email": "Please provide a valid email address",
  }),
  fideId: Joi.string().max(50).optional().allow("").messages({
    "string.max": "FIDE ID must not exceed 50 characters",
  }),
});

/**
 * Get participant by ID schema (params)
 */
const getParticipantByIdSchema = Joi.object({
  participantId: Joi.number().integer().positive().required().messages({
    "number.base": "Participant ID must be a number",
    "number.positive": "Participant ID must be positive",
    "any.required": "Participant ID is required",
  }),
});

/**
 * Upload document schema (params)
 */
const uploadDocumentParamsSchema = Joi.object({
  participantId: Joi.number().integer().positive().required().messages({
    "number.base": "Participant ID must be a number",
    "number.positive": "Participant ID must be positive",
    "any.required": "Participant ID is required",
  }),
  documentType: Joi.string()
    .valid("passportPhoto", "birthCertificate", "aadharCard")
    .required()
    .messages({
      "any.only": "Document type must be passportPhoto, birthCertificate, or aadharCard",
      "any.required": "Document type is required",
    }),
});

module.exports = {
  createParticipantSchema,
  updateParticipantSchema,
  getParticipantByIdSchema,
  uploadDocumentParamsSchema,
};
