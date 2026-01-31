/**
 * Event Validation Schemas
 * Joi validation schemas for event endpoints
 */

const Joi = require("joi");
const { EVENT_TYPES, EVENT_STATUS } = require("../../config/constants");

/**
 * Create event schema
 */
const createEventSchema = Joi.object({
  eventName: Joi.string().min(3).max(255).required().messages({
    "string.min": "Event name must be at least 3 characters long",
    "string.max": "Event name must not exceed 255 characters",
    "any.required": "Event name is required",
  }),
  description: Joi.string().allow("").optional(),
  eventDates: Joi.array().items(Joi.date()).min(1).required().messages({
    "array.min": "At least one event date is required",
    "any.required": "Event dates are required",
  }),
  eventStartTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .required()
    .messages({
      "string.pattern.base": "Event start time must be in HH:mm format",
      "any.required": "Event start time is required",
    }),
  eventEndTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional()
    .allow("")
    .messages({
      "string.pattern.base": "Event end time must be in HH:mm format",
    }),
  location: Joi.string().min(3).max(255).required().messages({
    "string.min": "Location must be at least 3 characters long",
    "any.required": "Location is required",
  }),
  venueAddress: Joi.string().allow("").optional(),
  googleMapLink: Joi.string().uri().allow("").optional().messages({
    "string.uri": "Please provide a valid Google Maps URL",
  }),
  entryFee: Joi.number().min(0).required().messages({
    "number.min": "Entry fee cannot be negative",
    "any.required": "Entry fee is required",
  }),
  prize: Joi.string().allow("").optional(),
  maxCapacity: Joi.number()
    .integer()
    .positive()
    .optional()
    .allow(null)
    .messages({
      "number.positive": "Max capacity must be positive",
    }),
  rulesText: Joi.string().allow("").optional(),
  eventType: Joi.string()
    .valid(...Object.values(EVENT_TYPES))
    .optional()
    .allow(null),
  isOnline: Joi.boolean().optional().default(false),
  categories: Joi.array()
    .items(Joi.number().integer().positive())
    .optional()
    .messages({
      "number.positive": "Category ID must be positive",
    }),
});

/**
 * Update event schema
 */
const updateEventSchema = Joi.object({
  eventName: Joi.string().min(3).max(255).optional(),
  description: Joi.string().allow("").optional(),
  eventDates: Joi.array().items(Joi.date()).min(1).optional(),
  eventStartTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional(),
  eventEndTime: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .optional()
    .allow(""),
  location: Joi.string().min(3).max(255).optional(),
  venueAddress: Joi.string().allow("").optional(),
  googleMapLink: Joi.string().uri().allow("").optional(),
  entryFee: Joi.number().min(0).optional(),
  prize: Joi.string().allow("").optional(),
  maxCapacity: Joi.number().integer().positive().optional().allow(null),
  rulesText: Joi.string().allow("").optional(),
  eventType: Joi.string()
    .valid(...Object.values(EVENT_TYPES))
    .optional()
    .allow(null),
  eventStatus: Joi.string()
    .valid(...Object.values(EVENT_STATUS))
    .optional(),
  isOnline: Joi.boolean().optional(),
  categories: Joi.array().items(Joi.number().integer().positive()).optional(),
});

/**
 * Get event by ID schema (params)
 */
const getEventByIdSchema = Joi.object({
  eventId: Joi.number().integer().positive().required().messages({
    "number.base": "Event ID must be a number",
    "number.positive": "Event ID must be positive",
    "any.required": "Event ID is required",
  }),
});

/**
 * List events query schema
 */
const listEventsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  eventStatus: Joi.string()
    .valid(...Object.values(EVENT_STATUS))
    .optional()
    .allow(""),
  eventType: Joi.string()
    .valid(...Object.values(EVENT_TYPES))
    .optional()
    .allow(""),
  search: Joi.string().optional().allow(""),
  isFeatured: Joi.boolean().optional(),
  isOnline: Joi.boolean().optional(),
  // Additional filter params from frontend
  category: Joi.string().optional().allow(""),
  status: Joi.string().optional().allow(""),
  sortBy: Joi.string().optional().allow(""),
});

/**
 * Create event edit request schema
 */
const createEditRequestSchema = Joi.object({
  message: Joi.string().min(10).max(500).required().messages({
    "string.min": "Message must be at least 10 characters long",
    "string.max": "Message must not exceed 500 characters",
    "any.required": "Message is required",
  }),
});

module.exports = {
  createEventSchema,
  updateEventSchema,
  getEventByIdSchema,
  listEventsQuerySchema,
  createEditRequestSchema,
};
