/**
 * Settings Service
 * Production-grade settings management with in-memory caching for speed
 */

const { prisma } = require("../../config/database");

// In-memory cache for ultra-fast reads
let settingsCache = null;
let cacheTimestamp = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL

// Default settings - will be seeded if not exist
const DEFAULT_SETTINGS = {
  // User Management
  allowOrganizerSelfRegistration: { value: true, type: "BOOLEAN", category: "user" },
  autoApproveOrganizers: { value: false, type: "BOOLEAN", category: "user" },
  allowUserSelfDelete: { value: false, type: "BOOLEAN", category: "user" },

  // Event Management
  allowOrganizerEventEdit: { value: false, type: "BOOLEAN", category: "event" },
  allowOrganizerEventDelete: { value: false, type: "BOOLEAN", category: "event" },
  autoApproveEvents: { value: true, type: "BOOLEAN", category: "event" },

  // Booking Management
  allowBookingCancellation: { value: true, type: "BOOLEAN", category: "booking" },
  allowRefunds: { value: true, type: "BOOLEAN", category: "booking" },
  autoConfirmBookings: { value: false, type: "BOOLEAN", category: "booking" },
  requirePaymentForBooking: { value: true, type: "BOOLEAN", category: "booking" },

  // Payment Settings
  enableOnlinePayment: { value: true, type: "BOOLEAN", category: "payment" },
  enableOfflinePayment: { value: true, type: "BOOLEAN", category: "payment" },
  platformFeeEnabled: { value: true, type: "BOOLEAN", category: "payment" },
  platformFeeAmount: { value: 10, type: "NUMBER", category: "payment" },

  // Notification Settings
  enableEmailNotifications: { value: true, type: "BOOLEAN", category: "notification" },
  enableSMSNotifications: { value: false, type: "BOOLEAN", category: "notification" },
  enablePushNotifications: { value: true, type: "BOOLEAN", category: "notification" },

  // System Settings
  maintenanceMode: { value: false, type: "BOOLEAN", category: "system" },
  allowNewRegistrations: { value: true, type: "BOOLEAN", category: "system" },
  allowNewEventCreation: { value: true, type: "BOOLEAN", category: "system" },
  allowNewBookings: { value: true, type: "BOOLEAN", category: "system" },

  // Feature Toggles
  enableFlashNews: { value: true, type: "BOOLEAN", category: "feature" },
  enableFeaturedEvents: { value: true, type: "BOOLEAN", category: "feature" },
  enableGoogleLogin: { value: true, type: "BOOLEAN", category: "feature" },
};

class SettingsService {
  /**
   * Initialize settings - seed defaults if not exist
   */
  async initializeSettings() {
    const existingCount = await prisma.setting.count();

    if (existingCount === 0) {
      console.log("🔧 Seeding default settings...");
      await this.seedDefaultSettings();
    }

    // Warm up cache
    await this.getAllSettings();
    console.log("✅ Settings loaded and cached");
  }

  /**
   * Seed default settings to database
   */
  async seedDefaultSettings() {
    const settingsToCreate = Object.entries(DEFAULT_SETTINGS).map(([key, config]) => ({
      settingKey: key,
      settingValue: JSON.stringify(config.value),
      settingType: config.type,
    }));

    await prisma.setting.createMany({
      data: settingsToCreate,
      skipDuplicates: true,
    });

    this.invalidateCache();
  }

  /**
   * Get all settings (cached for speed)
   * @returns {Promise<object>} All settings as key-value pairs
   */
  async getAllSettings() {
    // Return from cache if valid
    if (this.isCacheValid()) {
      return settingsCache;
    }

    // Fetch from database
    const settings = await prisma.setting.findMany();

    // Transform to key-value object
    const settingsObject = {};
    for (const setting of settings) {
      settingsObject[setting.settingKey] = this.parseValue(setting.settingValue, setting.settingType);
    }

    // Update cache
    settingsCache = settingsObject;
    cacheTimestamp = Date.now();

    return settingsObject;
  }

  /**
   * Get single setting by key (uses cache)
   * @param {string} key - Setting key
   * @returns {Promise<any>} Setting value
   */
  async getSetting(key) {
    const settings = await this.getAllSettings();
    return settings[key];
  }

  /**
   * Update single setting
   * @param {string} key - Setting key
   * @param {any} value - New value
   * @param {number} adminId - Admin making the change
   * @returns {Promise<object>} Updated setting
   */
  async updateSetting(key, value, adminId) {
    const defaultConfig = DEFAULT_SETTINGS[key];
    const settingType = defaultConfig?.type || "TEXT";

    const updated = await prisma.setting.upsert({
      where: { settingKey: key },
      update: {
        settingValue: JSON.stringify(value),
        settingType: settingType,
      },
      create: {
        settingKey: key,
        settingValue: JSON.stringify(value),
        settingType: settingType,
      },
    });

    // Log the change
    await this.logSettingChange(key, value, adminId);

    // Invalidate cache immediately
    this.invalidateCache();

    return {
      key: updated.settingKey,
      value: this.parseValue(updated.settingValue, updated.settingType),
    };
  }

  /**
   * Bulk update multiple settings
   * @param {object} settings - Object of key-value pairs
   * @param {number} adminId - Admin making the change
   * @returns {Promise<object>} Updated settings
   */
  async updateMultipleSettings(settings, adminId) {
    const updates = Object.entries(settings).map(async ([key, value]) => {
      const defaultConfig = DEFAULT_SETTINGS[key];
      const settingType = defaultConfig?.type || "TEXT";

      return prisma.setting.upsert({
        where: { settingKey: key },
        update: {
          settingValue: JSON.stringify(value),
          settingType: settingType,
        },
        create: {
          settingKey: key,
          settingValue: JSON.stringify(value),
          settingType: settingType,
        },
      });
    });

    await Promise.all(updates);

    // Log bulk change
    await this.logSettingChange("BULK_UPDATE", settings, adminId);

    // Invalidate cache
    this.invalidateCache();

    return this.getAllSettings();
  }

  /**
   * Reset all settings to defaults
   * @param {number} adminId - Admin making the change
   * @returns {Promise<object>} Reset settings
   */
  async resetToDefaults(adminId) {
    // Delete all existing settings
    await prisma.setting.deleteMany();

    // Seed defaults
    await this.seedDefaultSettings();

    // Log the reset
    await this.logSettingChange("RESET_TO_DEFAULTS", null, adminId);

    return this.getAllSettings();
  }

  /**
   * Check if a feature/permission is enabled
   * Fast check using cache
   * @param {string} key - Setting key
   * @returns {Promise<boolean>}
   */
  async isEnabled(key) {
    const value = await this.getSetting(key);
    return value === true;
  }

  /**
   * Get settings by category
   * @param {string} category - Category name
   * @returns {Promise<object>} Settings in category
   */
  async getSettingsByCategory(category) {
    const allSettings = await this.getAllSettings();
    const categorySettings = {};

    for (const [key, config] of Object.entries(DEFAULT_SETTINGS)) {
      if (config.category === category && allSettings[key] !== undefined) {
        categorySettings[key] = allSettings[key];
      }
    }

    return categorySettings;
  }

  /**
   * Parse stored value based on type
   */
  parseValue(value, type) {
    if (value === null || value === undefined) return null;

    try {
      const parsed = JSON.parse(value);

      switch (type) {
        case "BOOLEAN":
          return parsed === true || parsed === "true";
        case "NUMBER":
          return Number(parsed);
        case "JSON":
          return parsed;
        default:
          return parsed;
      }
    } catch {
      return value;
    }
  }

  /**
   * Check if cache is still valid
   */
  isCacheValid() {
    if (!settingsCache || !cacheTimestamp) return false;
    return Date.now() - cacheTimestamp < CACHE_TTL;
  }

  /**
   * Invalidate cache (called after updates)
   */
  invalidateCache() {
    settingsCache = null;
    cacheTimestamp = null;
  }

  /**
   * Force refresh cache
   */
  async refreshCache() {
    this.invalidateCache();
    return this.getAllSettings();
  }

  /**
   * Log setting changes for audit
   */
  async logSettingChange(key, value, adminId) {
    try {
      await prisma.auditLog.create({
        data: {
          adminId,
          action: "UPDATE_SETTING",
          entityType: "SETTING",
          entityId: 0,
          oldValues: null,
          newValues: JSON.stringify({ key, value }),
        },
      });
    } catch (error) {
      console.error("Failed to log setting change:", error);
    }
  }

  /**
   * Get default settings structure (for frontend)
   */
  getDefaultsStructure() {
    return DEFAULT_SETTINGS;
  }
}

module.exports = new SettingsService();
