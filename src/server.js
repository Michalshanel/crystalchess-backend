/**
 * Server Entry Point
 * Start the Express server and connect to database
 */

const app = require("./app");
const config = require("./config/environment");
const { connectDatabase } = require("./config/database");
const SettingsService = require("./modules/settings/settings.service");

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();

    // Initialize settings (seed defaults if needed, warm up cache)
    await SettingsService.initializeSettings();

    // Start Express server
    const server = app.listen(config.port, () => {
      console.log("");
      console.log(
        "🚀 ═══════════════════════════════════════════════════════════"
      );
      console.log("   CrystalChess Tournament Management System");
      console.log(
        "═══════════════════════════════════════════════════════════"
      );
      console.log(`   Environment: ${config.env}`);
      console.log(`   Server running on: http://localhost:${config.port}`);
      console.log(
        `   API Base URL: http://localhost:${config.port}/api/${config.apiVersion}`
      );
      console.log(`   Health Check: http://localhost:${config.port}/health`);
      console.log(
        "═══════════════════════════════════════════════════════════"
      );
      console.log("");
    });

    // Handle server errors
    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(`❌ Port ${config.port} is already in use`);
      } else {
        console.error("❌ Server error:", error);
      }
      process.exit(1);
    });

    // Graceful shutdown
    const gracefulShutdown = () => {
      console.log("\n⏳ Shutting down gracefully...");
      server.close(async () => {
        console.log("✅ HTTP server closed");
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error("⚠️  Forced shutdown after timeout");
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on("SIGTERM", gracefulShutdown);
    process.on("SIGINT", gracefulShutdown);
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  process.exit(1);
});

// Start the server
startServer();
