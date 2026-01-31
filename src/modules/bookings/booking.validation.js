/**
 * Booking Validation Schemas
 * Joi validation schemas for booking endpoints
 */

const Joi = require("joi");
const { BOOKING_STATUS, PAYMENT_STATUS } = require("../../config/constants");

/**
 * Create booking schema
 */
const createBookingSchema = Joi.object({
  eventId: Joi.number().integer().positive().required().messages({
    "number.base": "Event ID must be a number",
    "number.positive": "Event ID must be positive",
    "any.required": "Event ID is required",
  }),
  participants: Joi.array()
    .items(
      Joi.object({
        participantId: Joi.number().integer().positive().required().messages({
          "number.base": "Participant ID must be a number",
          "number.positive": "Participant ID must be positive",
          "any.required": "Participant ID is required",
        }),
        categoryCode: Joi.string().max(10).optional().messages({
          "string.max": "Category code must not exceed 10 characters",
        }),
      })
    )
    .min(1)
    .required()
    .messages({
      "array.min": "At least one participant is required",
      "any.required": "Participants are required",
    }),
});

/**
 * Get booking by ID schema (params)
 */
const getBookingByIdSchema = Joi.object({
  bookingId: Joi.number().integer().positive().required().messages({
    "number.base": "Booking ID must be a number",
    "number.positive": "Booking ID must be positive",
    "any.required": "Booking ID is required",
  }),
});

/**
 * List bookings query schema
 */
const listBookingsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  bookingStatus: Joi.string()
    .valid(...Object.values(BOOKING_STATUS))
    .optional(),
  paymentStatus: Joi.string()
    .valid(...Object.values(PAYMENT_STATUS))
    .optional(),
  eventId: Joi.number().integer().positive().optional(),
});

/**
 * Cancel booking schema
 */
const cancelBookingSchema = Joi.object({
  reason: Joi.string().min(10).max(500).optional().messages({
    "string.min": "Cancellation reason must be at least 10 characters",
    "string.max": "Cancellation reason must not exceed 500 characters",
  }),
});

module.exports = {
  createBookingSchema,
  getBookingByIdSchema,
  listBookingsQuerySchema,
  cancelBookingSchema,
};
