/**
 * Secure Clerk Authentication Middleware
 * Verifies JWT tokens server-side instead of trusting client-provided emails
 * Uses database for dynamic admin role management
 */
const { createClerkClient } = require('@clerk/clerk-sdk-node');
const User = require('../models/User');
const AdminRole = require('../models/AdminRole');
const { UnauthorizedError, ForbiddenError } = require('./errorHandler');

// Initialize Clerk client
const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY
});

/**
 * Extract and verify Clerk session token from Authorization header
 * Sets req.auth with verified user claims
 */
const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        error: 'No valid authorization header provided'
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify the session token with Clerk
    const sessionClaims = await clerkClient.verifyToken(token);

    if (!sessionClaims || !sessionClaims.sub) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
        error: 'Token verification failed'
      });
    }

    // Get full user details from Clerk
    const clerkUser = await clerkClient.users.getUser(sessionClaims.sub);

    // Attach verified user info to request
    req.auth = {
      userId: sessionClaims.sub,
      email: clerkUser.emailAddresses?.[0]?.emailAddress || null,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      sessionId: sessionClaims.sid
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);

    // Handle specific Clerk errors
    if (error.message?.includes('expired') || error.message?.includes('invalid')) {
      return res.status(401).json({
        success: false,
        message: 'Session expired',
        error: 'Please sign in again'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
      error: error.message
    });
  }
};

/**
 * Require admin privileges - must be used AFTER requireAuth
 * Checks database AdminRole collection for active admins
 * Replaces hardcoded email checking with dynamic database lookups
 */
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.auth || !req.auth.userId) {
      throw new UnauthorizedError('No authenticated user');
    }

    const { email, userId } = req.auth;

    // Check AdminRole collection for this email
    const adminRole = await AdminRole.findOne({
      email: email.toLowerCase(),
      status: 'active'
    });

    if (!adminRole) {
      throw new ForbiddenError('Admin privileges required');
    }

    // Check if account is locked due to failed login attempts
    if (adminRole.isLocked()) {
      throw new ForbiddenError('Account is temporarily locked. Please try again later.');
    }

    // Attach admin info to request
    req.isAdmin = true;
    req.adminRole = adminRole;
    req.adminEmail = email;
    req.adminPermissions = adminRole.getPermissions();

    // Record admin activity
    await AdminRole.recordActivity(email, 'admin_route_accessed', {
      path: req.path,
      method: req.method
    });

    next();
  } catch (error) {
    console.error('Admin middleware error:', error.message);
    throw error;
  }
};

/**
 * Require specific permission - must be used AFTER requireAdmin
 * Checks if authenticated admin has specific permission
 */
const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      if (!req.isAdmin || !req.adminRole) {
        throw new UnauthorizedError('Not authenticated as admin');
      }

      if (!req.adminRole.hasPermission(permission)) {
        throw new ForbiddenError(`Permission required: ${permission}`);
      }

      next();
    } catch (error) {
      console.error('Permission middleware error:', error.message);
      throw error;
    }
  };
};

/**
 * Optional auth - extracts user info if token present, but doesn't block
 * Useful for routes that work for both guests and logged-in users
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.auth = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    const sessionClaims = await clerkClient.verifyToken(token);

    if (sessionClaims && sessionClaims.sub) {
      const clerkUser = await clerkClient.users.getUser(sessionClaims.sub);
      req.auth = {
        userId: sessionClaims.sub,
        email: clerkUser.emailAddresses?.[0]?.emailAddress || null,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName
      };
    } else {
      req.auth = null;
    }

    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    req.auth = null;
    next();
  }
};

/**
 * Verify that the authenticated user owns the resource they're accessing
 * Compare req.auth.userId with :clerkId param
 */
const requireOwnership = (req, res, next) => {
  if (!req.auth || !req.auth.userId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  const resourceClerkId = req.params.clerkId;

  // Allow if user owns the resource OR is an admin
  if (req.auth.userId === resourceClerkId || req.isAdmin) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied',
    error: 'You can only access your own resources'
  });
};

module.exports = {
  requireAuth,
  requireAdmin,
  requirePermission,
  optionalAuth,
  requireOwnership
};
