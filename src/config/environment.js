/**
 * Environment Configuration
 * Centralized configuration for all environment variables
 */

require("dotenv").config();

const config = {
  // Server Configuration
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT, 10) || 5000,
  apiVersion: process.env.API_VERSION || "v1",

  // Database Configuration
  database: {
    url: process.env.DATABASE_URL,
    // Railway-specific variables (optional, for reference)
    host: process.env.MYSQLHOST,
    port: process.env.MYSQLPORT,
    user: process.env.MYSQLUSER,
    database: process.env.MYSQLDATABASE,
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || "your-secret-key",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    refreshSecret: process.env.JWT_REFRESH_SECRET || "your-refresh-secret",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
  },

  // Email Configuration
  email: {
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT, 10) || 587,
    secure: process.env.EMAIL_SECURE === "true",
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM || "noreply@crystalchess.com",
  },

  // Razorpay Configuration
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET,
  },

  // Google OAuth Configuration
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
  },

  // Frontend URL
  frontend: {
    url: process.env.FRONTEND_URL || "http://localhost:3000",
  },

  // File Upload Configuration
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 5242880, // 5MB
    allowedTypes: process.env.ALLOWED_FILE_TYPES?.split(",") || [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/pdf",
    ],
  },

  // Admin Configuration
  admin: {
    email: process.env.ADMIN_EMAIL || "admin@crystalchess.com",
  },

  // Platform Fee Configuration
  fees: {
    offlinePlatformFee: parseFloat(process.env.OFFLINE_PLATFORM_FEE) || 10,
    adminCommissionPercentage:
      parseFloat(process.env.ADMIN_COMMISSION_PERCENTAGE) || 0,
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  },
};

// Validate required environment variables
const validateConfig = () => {
  const errors = [];

  // Check database configuration
  // Accept either DATABASE_URL OR Railway's MySQL variables
  const hasDatabaseUrl = !!process.env.DATABASE_URL;
  const hasRailwayVars = !!(
    process.env.MYSQLUSER &&
    process.env.MYSQLHOST &&
    process.env.MYSQLDATABASE
  );

  if (!hasDatabaseUrl && !hasRailwayVars) {
    errors.push(
      "DATABASE_URL or Railway MySQL variables (MYSQLUSER, MYSQLHOST, MYSQLDATABASE)"
    );
  }

  // Check JWT secret (but allow default in development)
  if (
    config.env === "production" &&
    (!process.env.JWT_SECRET || process.env.JWT_SECRET === "your-secret-key")
  ) {
    errors.push("JWT_SECRET (must be set to a secure value in production)");
  }

  // Check email configuration (only required in production)
  if (config.env === "production") {
    if (!process.env.EMAIL_USER) {
      console.warn("⚠️  EMAIL_USER not set - email features will not work");
    }
    if (!process.env.EMAIL_PASSWORD) {
      console.warn("⚠️  EMAIL_PASSWORD not set - email features will not work");
    }
  }

  // Display validation results
  if (errors.length > 0) {
    console.error("❌ Missing CRITICAL environment variables:");
    errors.forEach((err) => console.error(`   - ${err}`));

    if (config.env === "production") {
      console.error(
        "\n💡 For Railway deployment, ensure all variables are set in the Railway dashboard."
      );
      process.exit(1);
    } else {
      console.warn("\n⚠️  Running in development mode with missing variables.");
    }
  } else {
    console.log("✅ All required environment variables are present");
  }
};

validateConfig();

module.exports = config;
