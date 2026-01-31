/**
 * Booking Controller
 * Handles HTTP requests for booking endpoints
 */

const BookingService = require("./booking.service");
const ResponseUtil = require("../../utils/response.util");
const { asyncHandler } = require("../../middleware/errorHandler.middleware");

class BookingController {
  /**
   * Create new booking
   * POST /api/v1/bookings
   */
  createBooking = asyncHandler(async (req, res) => {
    const booking = await BookingService.createBooking(
      req.user.userId,
      req.body
    );

    ResponseUtil.created(
      res,
      booking,
      "Booking created successfully. Please complete payment."
    );
  });

  /**
   * Get user's bookings
   * GET /api/v1/bookings
   */
  getUserBookings = asyncHandler(async (req, res) => {
    const result = await BookingService.getUserBookings(
      req.user.userId,
      req.query
    );

    ResponseUtil.paginated(
      res,
      result.bookings,
      result.pagination.page,
      result.pagination.limit,
      result.pagination.total,
      "Bookings retrieved successfully"
    );
  });

  /**
   * Get booking by ID
   * GET /api/v1/bookings/:bookingId
   */
  getBookingById = asyncHandler(async (req, res) => {
    const booking = await BookingService.getBookingById(
      parseInt(req.params.bookingId),
      req.user.userId
    );

    ResponseUtil.success(res, booking, "Booking retrieved successfully");
  });

  /**
   * Cancel booking
   * POST /api/v1/bookings/:bookingId/cancel
   */
  cancelBooking = asyncHandler(async (req, res) => {
    const booking = await BookingService.cancelBooking(
      parseInt(req.params.bookingId),
      req.user.userId,
      req.body.reason
    );

    ResponseUtil.success(res, booking, "Booking cancelled successfully");
  });

  /**
   * Confirm payment (demo/simulation)
   * POST /api/v1/bookings/:bookingId/confirm-payment
   */
  confirmPayment = asyncHandler(async (req, res) => {
    const booking = await BookingService.confirmPayment(
      parseInt(req.params.bookingId),
      req.user.userId,
      req.body.paymentMethod
    );

    ResponseUtil.success(res, booking, "Payment confirmed successfully");
  });
}

module.exports = new BookingController();
