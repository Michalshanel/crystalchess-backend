/**
 * Booking Routes
 * Define all booking-related routes
 */

const express = require("express");
const router = express.Router();
const BookingController = require("./booking.controller");
const { validate } = require("../../middleware/validation.middleware");
const { authenticate } = require("../../middleware/auth.middleware");
const {
  checkBookingsAllowed,
  checkCancellationAllowed,
  getPlatformFeeSettings,
} = require("../../middleware/settings.middleware");
const {
  createBookingSchema,
  getBookingByIdSchema,
  listBookingsQuerySchema,
  cancelBookingSchema,
} = require("./booking.validation");

/**
 * @route   POST /api/v1/bookings
 * @desc    Create new booking
 * @access  Private
 */
router.post(
  "/",
  authenticate,
  checkBookingsAllowed,
  getPlatformFeeSettings,
  validate(createBookingSchema),
  BookingController.createBooking
);

/**
 * @route   GET /api/v1/bookings
 * @desc    Get user's bookings with filters
 * @access  Private
 */
router.get(
  "/",
  authenticate,
  validate(listBookingsQuerySchema, "query"),
  BookingController.getUserBookings
);

/**
 * @route   GET /api/v1/bookings/:bookingId
 * @desc    Get booking by ID
 * @access  Private
 */
router.get(
  "/:bookingId",
  authenticate,
  validate(getBookingByIdSchema, "params"),
  BookingController.getBookingById
);

/**
 * @route   POST /api/v1/bookings/:bookingId/cancel
 * @desc    Cancel booking
 * @access  Private
 */
router.post(
  "/:bookingId/cancel",
  authenticate,
  checkCancellationAllowed,
  validate(getBookingByIdSchema, "params"),
  validate(cancelBookingSchema),
  BookingController.cancelBooking
);

/**
 * @route   POST /api/v1/bookings/:bookingId/confirm-payment
 * @desc    Confirm payment (demo/simulation)
 * @access  Private
 */
router.post(
  "/:bookingId/confirm-payment",
  authenticate,
  validate(getBookingByIdSchema, "params"),
  BookingController.confirmPayment
);

module.exports = router;
