/**
 * Settings Middleware
 * Enforce system settings/permissions at the API level
 */

const SettingsService = require("../modules/settings/settings.service");
const ResponseUtil = require("../utils/response.util");

/**
 * Check if system is in maintenance mode
 * Blocks all non-admin requests
 */
const checkMaintenanceMode = async (req, res, next) => {
  try {
    const isMaintenanceMode = await SettingsService.isEnabled("maintenanceMode");

    if (isMaintenanceMode) {
      // Allow admin users to pass through
      if (req.user && req.user.userType === "ADMIN") {
        return next();
      }

      return ResponseUtil.error(
        res,
        "System is currently under maintenance. Please try again later.",
        503
      );
    }

    next();
  } catch (error) {
    console.error("Maintenance check error:", error);
    next(); // Don't block on error
  }
};

/**
 * Check if new registrations are allowed
 */
const checkRegistrationsAllowed = async (req, res, next) => {
  try {
    const allowed = await SettingsService.isEnabled("allowNewRegistrations");

    if (!allowed) {
      return ResponseUtil.forbidden(
        res,
        "New registrations are currently disabled"
      );
    }

    next();
  } catch (error) {
    console.error("Registration check error:", error);
    next();
  }
};

/**
 * Check if new event creation is allowed
 */
const checkEventCreationAllowed = async (req, res, next) => {
  try {
    const allowed = await SettingsService.isEnabled("allowNewEventCreation");

    if (!allowed) {
      return ResponseUtil.forbidden(
        res,
        "Event creation is currently disabled"
      );
    }

    next();
  } catch (error) {
    console.error("Event creation check error:", error);
    next();
  }
};

/**
 * Check if new bookings are allowed
 */
const checkBookingsAllowed = async (req, res, next) => {
  try {
    const allowed = await SettingsService.isEnabled("allowNewBookings");

    if (!allowed) {
      return ResponseUtil.forbidden(
        res,
        "New bookings are currently disabled"
      );
    }

    next();
  } catch (error) {
    console.error("Booking check error:", error);
    next();
  }
};

/**
 * Check if booking cancellation is allowed
 */
const checkCancellationAllowed = async (req, res, next) => {
  try {
    const allowed = await SettingsService.isEnabled("allowBookingCancellation");

    if (!allowed) {
      return ResponseUtil.forbidden(
        res,
        "Booking cancellation is currently disabled"
      );
    }

    next();
  } catch (error) {
    console.error("Cancellation check error:", error);
    next();
  }
};

/**
 * Check if organizer can edit events
 */
const checkOrganizerCanEdit = async (req, res, next) => {
  try {
    // Admins can always edit
    if (req.user && req.user.userType === "ADMIN") {
      return next();
    }

    const allowed = await SettingsService.isEnabled("allowOrganizerEventEdit");

    if (!allowed) {
      return ResponseUtil.forbidden(
        res,
        "Direct event editing is disabled. Please submit an edit request."
      );
    }

    next();
  } catch (error) {
    console.error("Organizer edit check error:", error);
    next();
  }
};

/**
 * Check if online payment is enabled
 */
const checkOnlinePaymentEnabled = async (req, res, next) => {
  try {
    const enabled = await SettingsService.isEnabled("enableOnlinePayment");

    if (!enabled) {
      return ResponseUtil.forbidden(
        res,
        "Online payment is currently disabled"
      );
    }

    next();
  } catch (error) {
    console.error("Payment check error:", error);
    next();
  }
};

/**
 * Get platform fee settings
 * Attaches fee info to request for use in controllers
 */
const getPlatformFeeSettings = async (req, res, next) => {
  try {
    const feeEnabled = await SettingsService.isEnabled("platformFeeEnabled");
    const feeAmount = await SettingsService.getSetting("platformFeeAmount");

    req.platformFee = {
      enabled: feeEnabled,
      amount: feeEnabled ? (feeAmount || 10) : 0,
    };

    next();
  } catch (error) {
    console.error("Platform fee check error:", error);
    req.platformFee = { enabled: false, amount: 0 };
    next();
  }
};

/**
 * Generic permission check middleware factory
 * @param {string} settingKey - The setting key to check
 * @param {string} errorMessage - Custom error message
 */
const requireSetting = (settingKey, errorMessage) => {
  return async (req, res, next) => {
    try {
      const enabled = await SettingsService.isEnabled(settingKey);

      if (!enabled) {
        return ResponseUtil.forbidden(
          res,
          errorMessage || `This feature is currently disabled`
        );
      }

      next();
    } catch (error) {
      console.error(`Setting check error (${settingKey}):`, error);
      next();
    }
  };
};

module.exports = {
  checkMaintenanceMode,
  checkRegistrationsAllowed,
  checkEventCreationAllowed,
  checkBookingsAllowed,
  checkCancellationAllowed,
  checkOrganizerCanEdit,
  checkOnlinePaymentEnabled,
  getPlatformFeeSettings,
  requireSetting,
};
