/**
 * Database Configuration
 * Prisma client instance and database utilities
 * Works for both local development and Railway production
 */

const { PrismaClient } = require("@prisma/client");

/**
 * Construct DATABASE_URL from environment variables
 * Supports both direct DATABASE_URL and Railway's individual MySQL variables
 */
const getDatabaseUrl = () => {
  // If DATABASE_URL is already set (local development), use it
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  // Otherwise, construct from Railway's individual variables (production)
  const { MYSQLUSER, MYSQLPASSWORD, MYSQLHOST, MYSQLPORT, MYSQLDATABASE } =
    process.env;

  if (MYSQLUSER && MYSQLHOST && MYSQLDATABASE) {
    // URL encode the password to handle special characters
    const encodedPassword = MYSQLPASSWORD
      ? encodeURIComponent(MYSQLPASSWORD)
      : "";

    const password = encodedPassword ? `:${encodedPassword}` : "";
    const port = MYSQLPORT || "3306";

    const url = `mysql://${MYSQLUSER}${password}@${MYSQLHOST}:${port}/${MYSQLDATABASE}`;
    console.log(`🔧 Constructed DATABASE_URL from Railway variables`);
    return url;
  }

  throw new Error(
    "❌ Database configuration is missing. Please set DATABASE_URL or MySQL connection variables (MYSQLUSER, MYSQLHOST, MYSQLDATABASE)."
  );
};

// Set the DATABASE_URL environment variable before Prisma initializes
try {
  process.env.DATABASE_URL = getDatabaseUrl();
} catch (error) {
  console.error(error.message);
  if (process.env.NODE_ENV === "production") {
    process.exit(1);
  }
}

// Create Prisma client instance
const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"],
});

/**
 * Connect to database
 */
const connectDatabase = async () => {
  try {
    await prisma.$connect();
    console.log("✅ Database connected successfully");

    // Show connection info (hide password)
    const dbUrl = process.env.DATABASE_URL || "";
    const safeUrl = dbUrl.replace(/:[^:@]+@/, ":****@");
    console.log(`📍 Database: ${safeUrl}`);
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);

    // Provide helpful debugging info
    if (process.env.MYSQLHOST) {
      console.error(
        `🔍 Attempted connection to: ${process.env.MYSQLHOST}:${
          process.env.MYSQLPORT || "3306"
        }`
      );
    }

    process.exit(1);
  }
};

/**
 * Disconnect from database
 */
const disconnectDatabase = async () => {
  await prisma.$disconnect();
  console.log("📤 Database disconnected");
};

// Handle graceful shutdown
process.on("SIGINT", async () => {
  await disconnectDatabase();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await disconnectDatabase();
  process.exit(0);
});

module.exports = {
  prisma,
  connectDatabase,
  disconnectDatabase,
};
