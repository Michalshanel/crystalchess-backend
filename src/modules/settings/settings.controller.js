/**
 * Settings Controller
 * Handles HTTP requests for system settings
 */

const SettingsService = require("./settings.service");
const ResponseUtil = require("../../utils/response.util");
const { asyncHandler } = require("../../middleware/errorHandler.middleware");

class SettingsController {
  /**
   * Get all settings
   * GET /api/v1/settings
   */
  getAllSettings = asyncHandler(async (req, res) => {
    const settings = await SettingsService.getAllSettings();
    ResponseUtil.success(res, settings, "Settings retrieved successfully");
  });

  /**
   * Get single setting
   * GET /api/v1/settings/:key
   */
  getSetting = asyncHandler(async (req, res) => {
    const { key } = req.params;
    const value = await SettingsService.getSetting(key);

    if (value === undefined) {
      return ResponseUtil.notFound(res, `Setting '${key}' not found`);
    }

    ResponseUtil.success(res, { key, value }, "Setting retrieved successfully");
  });

  /**
   * Update single setting
   * PUT /api/v1/settings/:key
   */
  updateSetting = asyncHandler(async (req, res) => {
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined) {
      return ResponseUtil.badRequest(res, "Value is required");
    }

    const updated = await SettingsService.updateSetting(key, value, req.user.userId);
    ResponseUtil.success(res, updated, "Setting updated successfully");
  });

  /**
   * Bulk update settings
   * PUT /api/v1/settings
   */
  updateMultipleSettings = asyncHandler(async (req, res) => {
    const { settings } = req.body;

    if (!settings || typeof settings !== "object") {
      return ResponseUtil.badRequest(res, "Settings object is required");
    }

    const updated = await SettingsService.updateMultipleSettings(settings, req.user.userId);
    ResponseUtil.success(res, updated, "Settings updated successfully");
  });

  /**
   * Reset settings to defaults
   * POST /api/v1/settings/reset
   */
  resetToDefaults = asyncHandler(async (req, res) => {
    const settings = await SettingsService.resetToDefaults(req.user.userId);
    ResponseUtil.success(res, settings, "Settings reset to defaults");
  });

  /**
   * Get settings by category
   * GET /api/v1/settings/category/:category
   */
  getSettingsByCategory = asyncHandler(async (req, res) => {
    const { category } = req.params;
    const settings = await SettingsService.getSettingsByCategory(category);
    ResponseUtil.success(res, settings, `Settings for '${category}' retrieved`);
  });

  /**
   * Check if feature is enabled (public endpoint for fast checks)
   * GET /api/v1/settings/check/:key
   */
  checkFeature = asyncHandler(async (req, res) => {
    const { key } = req.params;
    const enabled = await SettingsService.isEnabled(key);
    ResponseUtil.success(res, { key, enabled }, "Feature check complete");
  });

  /**
   * Refresh settings cache
   * POST /api/v1/settings/refresh-cache
   */
  refreshCache = asyncHandler(async (req, res) => {
    const settings = await SettingsService.refreshCache();
    ResponseUtil.success(res, settings, "Cache refreshed successfully");
  });

  /**
   * Get public settings (non-sensitive settings for frontend)
   * GET /api/v1/settings/public
   */
  getPublicSettings = asyncHandler(async (req, res) => {
    const allSettings = await SettingsService.getAllSettings();

    // Only return non-sensitive settings
    const publicSettings = {
      maintenanceMode: allSettings.maintenanceMode,
      allowNewRegistrations: allSettings.allowNewRegistrations,
      enableOnlinePayment: allSettings.enableOnlinePayment,
      enableOfflinePayment: allSettings.enableOfflinePayment,
      enableFlashNews: allSettings.enableFlashNews,
      enableFeaturedEvents: allSettings.enableFeaturedEvents,
      enableGoogleLogin: allSettings.enableGoogleLogin,
      platformFeeAmount: allSettings.platformFeeAmount,
    };

    ResponseUtil.success(res, publicSettings, "Public settings retrieved");
  });
}

module.exports = new SettingsController();
