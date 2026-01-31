/**
 * Payment Service
 * Business logic for payment operations with Razorpay
 */

const Razorpay = require("razorpay");
const crypto = require("crypto");
const { prisma } = require("../../config/database");
const config = require("../../config/environment");
const EmailService = require("../notifications/email.service");
const {
  PAYMENT_STATUS,
  BOOKING_STATUS,
  PAYMENT_GATEWAYS,
} = require("../../config/constants");

class PaymentService {
  constructor() {
    // Initialize Razorpay instance
    this.razorpay = new Razorpay({
      key_id: config.razorpay.keyId,
      key_secret: config.razorpay.keySecret,
    });
  }

  /**
   * Create Razorpay order for booking
   * @param {number} bookingId - Booking ID
   * @param {number} userId - User ID
   * @returns {Promise<object>} Razorpay order details
   */
  async createRazorpayOrder(bookingId, userId) {
    // Get booking details
    const booking = await prisma.booking.findFirst({
      where: {
        bookingId,
        userId,
      },
      include: {
        event: {
          select: {
            eventName: true,
          },
        },
      },
    });

    if (!booking) {
      throw new Error("Booking not found");
    }

    // Check if booking is already paid
    if (booking.paymentStatus === PAYMENT_STATUS.PAID) {
      throw new Error("Booking is already paid");
    }

    // Check if booking is cancelled
    if (booking.bookingStatus === BOOKING_STATUS.CANCELLED) {
      throw new Error("Cannot pay for cancelled booking");
    }

    // Create Razorpay order
    const amount = Math.round(Number(booking.amountPaid) * 100); // Convert to paise

    const razorpayOrder = await this.razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: booking.bookingReference,
      notes: {
        bookingId: booking.bookingId,
        eventName: booking.event.eventName,
      },
    });

    // Store payment record
    await prisma.payment.create({
      data: {
        bookingId: booking.bookingId,
        transactionId: razorpayOrder.id,
        paymentGateway: PAYMENT_GATEWAYS.RAZORPAY,
        amount: booking.amountPaid,
        currency: "INR",
        paymentStatus: PAYMENT_STATUS.PENDING,
        gatewayResponse: JSON.stringify(razorpayOrder),
      },
    });

    return {
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      bookingReference: booking.bookingReference,
      razorpayKeyId: config.razorpay.keyId,
    };
  }

  /**
   * Verify Razorpay payment signature
   * @param {string} orderId - Razorpay order ID
   * @param {string} paymentId - Razorpay payment ID
   * @param {string} signature - Razorpay signature
   * @returns {boolean} Verification result
   */
  verifyRazorpaySignature(orderId, paymentId, signature) {
    const body = orderId + "|" + paymentId;
    const expectedSignature = crypto
      .createHmac("sha256", config.razorpay.keySecret)
      .update(body)
      .digest("hex");

    return expectedSignature === signature;
  }

  /**
   * Complete payment after Razorpay verification
   * @param {object} paymentData - Payment verification data
   * @returns {Promise<object>} Updated booking
   */
  async completePayment(paymentData) {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } =
      paymentData;

    // Verify signature
    const isValid = this.verifyRazorpaySignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );

    if (!isValid) {
      throw new Error("Invalid payment signature");
    }

    // Get payment record
    const payment = await prisma.payment.findFirst({
      where: {
        transactionId: razorpayOrderId,
      },
      include: {
        booking: {
          include: {
            user: true,
            event: true,
            participants: {
              include: {
                participant: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new Error("Payment record not found");
    }

    // Update payment and booking in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update payment status
      await tx.payment.update({
        where: { paymentId: payment.paymentId },
        data: {
          paymentStatus: PAYMENT_STATUS.PAID,
          gatewayResponse: JSON.stringify({
            orderId: razorpayOrderId,
            paymentId: razorpayPaymentId,
          }),
        },
      });

      // Update booking status
      const updatedBooking = await tx.booking.update({
        where: { bookingId: payment.bookingId },
        data: {
          bookingStatus: BOOKING_STATUS.CONFIRMED,
          paymentStatus: PAYMENT_STATUS.PAID,
        },
        include: {
          event: true,
          user: true,
          participants: {
            include: {
              participant: true,
            },
          },
        },
      });

      return updatedBooking;
    });

    // Send confirmation email
    try {
      await EmailService.sendBookingConfirmationEmail(result);
    } catch (error) {
      console.error("Failed to send confirmation email:", error);
    }

    return result;
  }

  /**
   * Record offline payment
   * @param {number} bookingId - Booking ID
   * @param {number} userId - User ID
   * @param {object} paymentData - Offline payment data
   * @returns {Promise<object>} Updated booking
   */
  async recordOfflinePayment(bookingId, userId, paymentData) {
    // Get booking
    const booking = await prisma.booking.findFirst({
      where: {
        bookingId,
        userId,
      },
      include: {
        event: true,
        user: true,
        participants: {
          include: {
            participant: true,
          },
        },
      },
    });

    if (!booking) {
      throw new Error("Booking not found");
    }

    if (booking.paymentStatus === PAYMENT_STATUS.PAID) {
      throw new Error("Booking is already paid");
    }

    // Record offline payment
    const result = await prisma.$transaction(async (tx) => {
      // Create payment record
      await tx.payment.create({
        data: {
          bookingId: booking.bookingId,
          transactionId: `OFFLINE-${booking.bookingReference}`,
          paymentGateway: PAYMENT_GATEWAYS.OFFLINE,
          amount: booking.amountPaid,
          currency: "INR",
          paymentStatus: PAYMENT_STATUS.PAID,
          gatewayResponse: JSON.stringify(paymentData),
        },
      });

      // Update booking
      const updatedBooking = await tx.booking.update({
        where: { bookingId },
        data: {
          bookingStatus: BOOKING_STATUS.CONFIRMED,
          paymentStatus: PAYMENT_STATUS.PAID,
        },
        include: {
          event: true,
          user: true,
          participants: {
            include: {
              participant: true,
            },
          },
        },
      });

      return updatedBooking;
    });

    // Send confirmation email
    try {
      await EmailService.sendBookingConfirmationEmail(result);
    } catch (error) {
      console.error("Failed to send confirmation email:", error);
    }

    return result;
  }

  /**
   * Get payment details for booking
   * @param {number} bookingId - Booking ID
   * @param {number} userId - User ID
   * @returns {Promise<object>} Payment details
   */
  async getPaymentDetails(bookingId, userId) {
    // Verify booking belongs to user
    const booking = await prisma.booking.findFirst({
      where: {
        bookingId,
        userId,
      },
    });

    if (!booking) {
      throw new Error("Booking not found");
    }

    // Get payment records
    const payments = await prisma.payment.findMany({
      where: { bookingId },
      orderBy: { paymentDate: "desc" },
    });

    return payments;
  }

  /**
   * Initiate refund
   * @param {number} paymentId - Payment ID
   * @returns {Promise<object>} Refund details
   */
  async initiateRefund(paymentId) {
    const payment = await prisma.payment.findUnique({
      where: { paymentId },
      include: {
        booking: true,
      },
    });

    if (!payment) {
      throw new Error("Payment not found");
    }

    if (payment.paymentStatus !== PAYMENT_STATUS.PAID) {
      throw new Error("Cannot refund unpaid payment");
    }

    // For Razorpay payments, initiate refund through API
    if (payment.paymentGateway === PAYMENT_GATEWAYS.RAZORPAY) {
      const gatewayResponse = JSON.parse(payment.gatewayResponse);
      const paymentId = gatewayResponse.paymentId;

      try {
        const refund = await this.razorpay.payments.refund(paymentId, {
          amount: Math.round(Number(payment.amount) * 100), // Full refund in paise
          speed: "normal",
        });

        // Update payment record
        await prisma.payment.update({
          where: { paymentId: payment.paymentId },
          data: {
            paymentStatus: PAYMENT_STATUS.REFUNDED,
            refundDate: new Date(),
            refundAmount: payment.amount,
            gatewayResponse: JSON.stringify(refund),
          },
        });

        return refund;
      } catch (error) {
        throw new Error(`Refund failed: ${error.message}`);
      }
    }

    // For offline payments, just mark as refunded
    await prisma.payment.update({
      where: { paymentId: payment.paymentId },
      data: {
        paymentStatus: PAYMENT_STATUS.REFUNDED,
        refundDate: new Date(),
        refundAmount: payment.amount,
      },
    });

    return { status: "refunded", amount: payment.amount };
  }
}

module.exports = new PaymentService();
