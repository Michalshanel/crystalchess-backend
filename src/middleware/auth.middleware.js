/**
 * Authentication Middleware
 * Middleware to verify JWT tokens and check user permissions
 */

const { prisma } = require("../config/database");
const TokenUtil = require("../utils/token.util");
const ResponseUtil = require("../utils/response.util");
const { USER_TYPES, USER_STATUS, MESSAGES } = require("../config/constants");

/**
 * Verify JWT token and authenticate user
 * Middleware that checks if request has valid JWT token
 */
const authenticate = async (req, res, next) => {
  try {
    // Extract token from authorization header
    const authHeader = req.headers.authorization;
    const token = TokenUtil.extractTokenFromHeader(authHeader);

    if (!token) {
      return ResponseUtil.unauthorized(res, "No token provided");
    }

    // Verify token
    let decoded;
    try {
      decoded = TokenUtil.verifyAccessToken(token);
    } catch (error) {
      return ResponseUtil.unauthorized(res, error.message);
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { userId: decoded.userId },
      select: {
        userId: true,
        email: true,
        fullName: true,
        userType: true,
        userStatus: true,
        emailVerified: true,
        organizerApproved: true,
      },
    });

    if (!user) {
      return ResponseUtil.unauthorized(res, "User not found");
    }

    // Check if user account is active
    if (user.userStatus !== USER_STATUS.ACTIVE) {
      return ResponseUtil.forbidden(res, MESSAGES.ACCOUNT_SUSPENDED);
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return ResponseUtil.forbidden(res, MESSAGES.ACCOUNT_NOT_VERIFIED);
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication
 * Same as authenticate but doesn't fail if no token provided
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = TokenUtil.extractTokenFromHeader(authHeader);

    if (!token) {
      // No token provided, continue without user
      req.user = null;
      return next();
    }

    // Verify token
    const decoded = TokenUtil.verifyAccessToken(token);

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { userId: decoded.userId },
      select: {
        userId: true,
        email: true,
        fullName: true,
        userType: true,
        userStatus: true,
        emailVerified: true,
        organizerApproved: true,
      },
    });

    req.user = user || null;
    next();
  } catch (error) {
    // If token verification fails, continue without user
    req.user = null;
    next();
  }
};

/**
 * Check if user is a player
 * Middleware to restrict access to player users only
 */
const isPlayer = (req, res, next) => {
  if (req.user.userType !== USER_TYPES.PLAYER) {
    return ResponseUtil.forbidden(res, "Access restricted to players only");
  }
  next();
};

/**
 * Check if user is an organizer
 * Middleware to restrict access to approved organizer users only
 */
const isOrganizer = (req, res, next) => {
  if (req.user.userType !== USER_TYPES.ORGANIZER) {
    return ResponseUtil.forbidden(res, "Access restricted to organizers only");
  }

  // Check if organizer is approved
  if (!req.user.organizerApproved) {
    return ResponseUtil.forbidden(res, MESSAGES.ORGANIZER_PENDING_APPROVAL);
  }

  next();
};

/**
 * Check if user is an admin
 * Middleware to restrict access to admin users only
 */
const isAdmin = (req, res, next) => {
  if (req.user.userType !== USER_TYPES.ADMIN) {
    return ResponseUtil.forbidden(res, "Access restricted to admins only");
  }
  next();
};

/**
 * Check if user is organizer or admin
 * Middleware for routes accessible by both organizers and admins
 */
const isOrganizerOrAdmin = (req, res, next) => {
  const { userType, organizerApproved } = req.user;

  if (userType === USER_TYPES.ADMIN) {
    return next();
  }

  if (userType === USER_TYPES.ORGANIZER && organizerApproved) {
    return next();
  }

  return ResponseUtil.forbidden(res, "Access restricted");
};

/**
 * Check if user can access resource
 * Middleware to check if user owns the resource or is admin
 */
const canAccessResource = (userIdField = "userId") => {
  return (req, res, next) => {
    const resourceUserId = parseInt(req.params[userIdField], 10);
    const requestingUserId = req.user.userId;
    const userType = req.user.userType;

    // Admin can access all resources
    if (userType === USER_TYPES.ADMIN) {
      return next();
    }

    // User can only access their own resources
    if (resourceUserId !== requestingUserId) {
      return ResponseUtil.forbidden(
        res,
        "You can only access your own resources"
      );
    }

    next();
  };
};

module.exports = {
  authenticate,
  optionalAuth,
  isPlayer,
  isOrganizer,
  isAdmin,
  isOrganizerOrAdmin,
  canAccessResource,
};
