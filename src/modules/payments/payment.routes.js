/**
 * Payment Routes
 * Define all payment-related routes
 */

const express = require("express");
const router = express.Router();
const PaymentController = require("./payment.controller");
const { authenticate } = require("../../middleware/auth.middleware");

/**
 * @route   POST /api/v1/payments/create-order
 * @desc    Create Razorpay order for booking
 * @access  Private
 */
router.post("/create-order", authenticate, PaymentController.createOrder);

/**
 * @route   POST /api/v1/payments/verify
 * @desc    Verify Razorpay payment and complete booking
 * @access  Private
 */
router.post("/verify", authenticate, PaymentController.verifyPayment);

/**
 * @route   POST /api/v1/payments/offline
 * @desc    Record offline payment
 * @access  Private
 */
router.post("/offline", authenticate, PaymentController.recordOfflinePayment);

/**
 * @route   GET /api/v1/payments/booking/:bookingId
 * @desc    Get payment details for booking
 * @access  Private
 */
router.get(
  "/booking/:bookingId",
  authenticate,
  PaymentController.getPaymentDetails
);

module.exports = router;
