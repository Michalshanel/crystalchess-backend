/**
 * Application Constants
 * Define all constant values used across the application
 */

module.exports = {
  // User Types
  USER_TYPES: {
    PLAYER: "PLAYER",
    ORGANIZER: "ORGANIZER",
    ADMIN: "ADMIN",
  },

  // User Status
  USER_STATUS: {
    ACTIVE: "ACTIVE",
    INACTIVE: "INACTIVE",
    SUSPENDED: "SUSPENDED",
  },

  // Gender
  GENDER: {
    MALE: "MALE",
    FEMALE: "FEMALE",
    OTHERS: "OTHERS",
  },

  // Event Types
  EVENT_TYPES: {
    FIDE_RATED: "FIDE_RATED",
    STATE_LEVEL: "STATE_LEVEL",
    DISTRICT_LEVEL: "DISTRICT_LEVEL",
    INTER_SCHOOL_LEVEL: "INTER_SCHOOL_LEVEL",
    COLLEGE_LEVEL: "COLLEGE_LEVEL",
  },

  // Event Status
  EVENT_STATUS: {
    UPCOMING: "UPCOMING",
    IN_PROGRESS: "IN_PROGRESS",
    COMPLETED: "COMPLETED",
    CANCELLED: "CANCELLED",
  },

  // Booking Status
  BOOKING_STATUS: {
    PENDING: "PENDING",
    CONFIRMED: "CONFIRMED",
    CANCELLED: "CANCELLED",
    COMPLETED: "COMPLETED",
  },

  // Payment Status (Prisma enum names - uppercase, maps to lowercase in DB)
  PAYMENT_STATUS: {
    PENDING: "PENDING",
    PAID: "PAID",
    COMPLETED: "PAID",
    REFUNDED: "REFUNDED",
    FAILED: "FAILED",
  },

  // Payment Gateways (Prisma enum names)
  PAYMENT_GATEWAYS: {
    RAZORPAY: "razorpay",
    STRIPE: "stripe",
    PAYPAL: "paypal",
  },

  // Enrollment Status
  ENROLLMENT_STATUS: {
    PENDING: "PENDING",
    APPROVED: "APPROVED",
    REJECTED: "REJECTED",
    CANCELLED: "CANCELLED",
  },

  // Request Status
  REQUEST_STATUS: {
    PENDING: "PENDING",
    APPROVED: "APPROVED",
    REJECTED: "REJECTED",
  },

  // Notification Types
  NOTIFICATION_TYPES: {
    EMAIL: "EMAIL",
    SMS: "SMS",
    BOTH: "BOTH",
  },

  // Notification Status
  NOTIFICATION_STATUS: {
    PENDING: "PENDING",
    SENT: "SENT",
    FAILED: "FAILED",
  },

  // Email Template Names
  EMAIL_TEMPLATES: {
    WELCOME: "WELCOME",
    EMAIL_VERIFICATION: "EMAIL_VERIFICATION",
    PASSWORD_RESET: "PASSWORD_RESET",
    ORGANIZER_APPROVAL: "ORGANIZER_APPROVAL",
    ORGANIZER_REJECTION: "ORGANIZER_REJECTION",
    BOOKING_CONFIRMATION: "BOOKING_CONFIRMATION",
    PAYMENT_SUCCESS: "PAYMENT_SUCCESS",
    ENROLLMENT_RECEIVED: "ENROLLMENT_RECEIVED",
    ENROLLMENT_APPROVED: "ENROLLMENT_APPROVED",
    EVENT_REMINDER: "EVENT_REMINDER",
  },

  // Entity Types for Audit Logs
  ENTITY_TYPES: {
    USER: "USER",
    EVENT: "EVENT",
    BOOKING: "BOOKING",
    PAYMENT: "PAYMENT",
    SETTINGS: "SETTINGS",
  },

  // File Upload Paths
  UPLOAD_PATHS: {
    PROFILES: "uploads/profiles",
    DOCUMENTS: "uploads/documents",
    EVENTS: "uploads/events",
    RULES: "uploads/rules",
  },

  // Tournament Category Gender Rules
  // Female can participate in both male and female tournaments
  // Male can only participate in male tournaments
  CATEGORY_GENDER_RULES: {
    FEMALE_CAN_JOIN_MALE: true,
    MALE_CAN_JOIN_FEMALE: false,
  },

  // Booking Reference Generation
  BOOKING_REFERENCE_PREFIX: "CC",
  BOOKING_REFERENCE_LENGTH: 10,

  // Pagination
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,

  // Token Expiry
  EMAIL_VERIFICATION_TOKEN_EXPIRY: 24 * 60 * 60 * 1000, // 24 hours
  PASSWORD_RESET_TOKEN_EXPIRY: 1 * 60 * 60 * 1000, // 1 hour

  // Response Messages
  MESSAGES: {
    SUCCESS: "Operation completed successfully",
    CREATED: "Resource created successfully",
    UPDATED: "Resource updated successfully",
    DELETED: "Resource deleted successfully",
    NOT_FOUND: "Resource not found",
    UNAUTHORIZED: "Unauthorized access",
    FORBIDDEN: "Access forbidden",
    BAD_REQUEST: "Invalid request",
    SERVER_ERROR: "Internal server error",
    VALIDATION_ERROR: "Validation error",

    // Auth Messages
    LOGIN_SUCCESS: "Login successful",
    LOGOUT_SUCCESS: "Logout successful",
    REGISTER_SUCCESS: "Registration successful. Please verify your email.",
    EMAIL_VERIFIED: "Email verified successfully",
    PASSWORD_RESET_SENT: "Password reset link sent to your email",
    PASSWORD_RESET_SUCCESS: "Password reset successful",
    INVALID_CREDENTIALS: "Invalid email or password",
    EMAIL_ALREADY_EXISTS: "Email already exists",
    ACCOUNT_NOT_VERIFIED: "Please verify your email to login",
    ACCOUNT_SUSPENDED: "Your account has been suspended",

    // Organizer Messages
    ORGANIZER_PENDING_APPROVAL:
      "Your organizer account is pending admin approval",
    ORGANIZER_APPROVED: "Your organizer account has been approved",
    ORGANIZER_REJECTED: "Your organizer application has been rejected",

    // Booking Messages
    BOOKING_SUCCESS: "Booking created successfully",
    BOOKING_CANCELLED: "Booking cancelled successfully",
    INSUFFICIENT_SLOTS: "Insufficient slots available",
    GENDER_RESTRICTION:
      "Male participants cannot register for female-only tournaments",

    // Payment Messages
    PAYMENT_SUCCESS: "Payment completed successfully",
    PAYMENT_FAILED: "Payment failed. Please try again.",
    REFUND_INITIATED: "Refund initiated successfully",
  },

  // HTTP Status Codes
  STATUS_CODES: {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    SERVER_ERROR: 500,
  },
};
