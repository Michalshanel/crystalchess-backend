/**
 * Settings Routes
 * API endpoints for system settings management
 */

const express = require("express");
const router = express.Router();
const SettingsController = require("./settings.controller");
const { authenticate, isAdmin } = require("../../middleware/auth.middleware");

/**
 * @route   GET /api/v1/settings/public
 * @desc    Get public settings (no auth required)
 * @access  Public
 */
router.get("/public", SettingsController.getPublicSettings);

/**
 * @route   GET /api/v1/settings/check/:key
 * @desc    Quick check if feature is enabled
 * @access  Public
 */
router.get("/check/:key", SettingsController.checkFeature);

/**
 * @route   GET /api/v1/settings
 * @desc    Get all settings (admin only)
 * @access  Private (Admin)
 */
router.get("/", authenticate, isAdmin, SettingsController.getAllSettings);

/**
 * @route   GET /api/v1/settings/category/:category
 * @desc    Get settings by category
 * @access  Private (Admin)
 */
router.get("/category/:category", authenticate, isAdmin, SettingsController.getSettingsByCategory);

/**
 * @route   GET /api/v1/settings/:key
 * @desc    Get single setting
 * @access  Private (Admin)
 */
router.get("/:key", authenticate, isAdmin, SettingsController.getSetting);

/**
 * @route   PUT /api/v1/settings
 * @desc    Bulk update settings
 * @access  Private (Admin)
 */
router.put("/", authenticate, isAdmin, SettingsController.updateMultipleSettings);

/**
 * @route   PUT /api/v1/settings/:key
 * @desc    Update single setting
 * @access  Private (Admin)
 */
router.put("/:key", authenticate, isAdmin, SettingsController.updateSetting);

/**
 * @route   POST /api/v1/settings/reset
 * @desc    Reset all settings to defaults
 * @access  Private (Admin)
 */
router.post("/reset", authenticate, isAdmin, SettingsController.resetToDefaults);

/**
 * @route   POST /api/v1/settings/refresh-cache
 * @desc    Force refresh the settings cache
 * @access  Private (Admin)
 */
router.post("/refresh-cache", authenticate, isAdmin, SettingsController.refreshCache);

module.exports = router;
