/**
 * Payment Controller
 * Handles HTTP requests for payment endpoints
 */

const PaymentService = require("./payment.service");
const ResponseUtil = require("../../utils/response.util");
const { asyncHandler } = require("../../middleware/errorHandler.middleware");

class PaymentController {
  /**
   * Create Razorpay order for booking
   * POST /api/v1/payments/create-order
   */
  createOrder = asyncHandler(async (req, res) => {
    const { bookingId } = req.body;

    const order = await PaymentService.createRazorpayOrder(
      parseInt(bookingId),
      req.user.userId
    );

    ResponseUtil.success(res, order, "Payment order created successfully");
  });

  /**
   * Verify and complete Razorpay payment
   * POST /api/v1/payments/verify
   */
  verifyPayment = asyncHandler(async (req, res) => {
    const booking = await PaymentService.completePayment(req.body);

    ResponseUtil.success(
      res,
      booking,
      "Payment verified and booking confirmed"
    );
  });

  /**
   * Record offline payment
   * POST /api/v1/payments/offline
   */
  recordOfflinePayment = asyncHandler(async (req, res) => {
    const { bookingId, ...paymentData } = req.body;

    const booking = await PaymentService.recordOfflinePayment(
      parseInt(bookingId),
      req.user.userId,
      paymentData
    );

    ResponseUtil.success(res, booking, "Offline payment recorded successfully");
  });

  /**
   * Get payment details for booking
   * GET /api/v1/payments/booking/:bookingId
   */
  getPaymentDetails = asyncHandler(async (req, res) => {
    const payments = await PaymentService.getPaymentDetails(
      parseInt(req.params.bookingId),
      req.user.userId
    );

    ResponseUtil.success(
      res,
      payments,
      "Payment details retrieved successfully"
    );
  });
}

module.exports = new PaymentController();
