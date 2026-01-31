/**
 * Express Application Setup
 * Configure Express app with middleware and routes
 */

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const config = require("./config/environment");
const {
  errorHandler,
  notFoundHandler,
} = require("./middleware/errorHandler.middleware");

// Import routes
const authRoutes = require("./modules/auth/auth.routes");
const userRoutes = require("./modules/users/user.routes");
const participantRoutes = require("./modules/participants/participant.routes");
const eventRoutes = require("./modules/events/event.routes");
const bookingRoutes = require("./modules/bookings/booking.routes");
const paymentRoutes = require("./modules/payments/payment.routes");
const adminRoutes = require("./modules/admin/admin.routes");
const enrollmentRoutes = require("./modules/enrollments/enrollment.routes");
const notificationRoutes = require("./modules/notifications/notification.routes");
const settingsRoutes = require("./modules/settings/settings.routes");

// Create Express app
const app = express();

// Trust proxy (needed for rate limiting behind reverse proxy)
app.set("trust proxy", 1);

// Security middleware - Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// CORS configuration - Allow multiple origins
const allowedOrigins = [
  config.frontend.url,
  "https://crystalchess-frontend-4693yhruh-shanels-projects-1e445506.vercel.app",
  "https://crystalchess-frontend.vercel.app",
  "http://localhost:3000",
  "http://localhost:5173",
].filter(Boolean).map(url => url.replace(/\/$/, '')); // Remove trailing slashes

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl, Postman, etc.)
      if (!origin) return callback(null, true);

      // Check if origin matches any allowed origin (with or without https://)
      const normalizedOrigin = origin.replace(/\/$/, '');
      const isAllowed = allowedOrigins.some(allowed => {
        // Direct match
        if (normalizedOrigin === allowed) return true;
        // Match without protocol
        const originHost = normalizedOrigin.replace(/^https?:\/\//, '');
        const allowedHost = allowed.replace(/^https?:\/\//, '');
        if (originHost === allowedHost) return true;
        // Match Vercel preview URLs (contain vercel.app)
        if (normalizedOrigin.includes('vercel.app')) return true;
        return false;
      });

      if (isAllowed) {
        return callback(null, true);
      }

      // Log rejected origin for debugging
      console.log(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve static files (uploaded files)
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all routes
app.use(limiter);

// Request logging middleware (development only)
if (config.env === "development") {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`, {
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  });
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "CrystalChess API is running",
    timestamp: new Date().toISOString(),
    environment: config.env,
  });
});

// API version prefix
const API_PREFIX = `/api/${config.apiVersion}`;

// Mount routes
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/participants`, participantRoutes);
app.use(`${API_PREFIX}/events`, eventRoutes);
app.use(`${API_PREFIX}/bookings`, bookingRoutes);
app.use(`${API_PREFIX}/payments`, paymentRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes);
app.use(`${API_PREFIX}/enrollments`, enrollmentRoutes);
app.use(`${API_PREFIX}/notifications`, notificationRoutes);
app.use(`${API_PREFIX}/settings`, settingsRoutes);

// 404 handler - must be after all routes
app.use(notFoundHandler);

// Global error handler - must be last
app.use(errorHandler);

module.exports = app;
