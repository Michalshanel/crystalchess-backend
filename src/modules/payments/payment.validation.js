/**
 * Payment Validation Schemas
 * Joi validation schemas for payment endpoints
 */

const Joi = require("joi");

/**
 * Create order schema
 */
const createOrderSchema = Joi.object({
  bookingId: Joi.number().integer().positive().required().messages({
    "number.base": "Booking ID must be a number",
    "number.positive": "Booking ID must be positive",
    "any.required": "Booking ID is required",
  }),
});

/**
 * Verify payment schema
 */
const verifyPaymentSchema = Joi.object({
  razorpayOrderId: Joi.string().required().messages({
    "any.required": "Razorpay order ID is required",
  }),
  razorpayPaymentId: Joi.string().required().messages({
    "any.required": "Razorpay payment ID is required",
  }),
  razorpaySignature: Joi.string().required().messages({
    "any.required": "Razorpay signature is required",
  }),
});

/**
 * Offline payment schema
 */
const offlinePaymentSchema = Joi.object({
  bookingId: Joi.number().integer().positive().required().messages({
    "number.base": "Booking ID must be a number",
    "number.positive": "Booking ID must be positive",
    "any.required": "Booking ID is required",
  }),
  transactionReference: Joi.string().optional(),
  paymentMode: Joi.string().optional(),
  notes: Joi.string().optional(),
});

module.exports = {
  createOrderSchema,
  verifyPaymentSchema,
  offlinePaymentSchema,
};
