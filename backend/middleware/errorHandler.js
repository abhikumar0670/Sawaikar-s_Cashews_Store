/**
 * Centralized Error Handler Middleware
 * Standardizes all error responses across the API
 * Prevents leaking internal error details in production
 */

class AppError extends Error {
  constructor(message, statusCode, errorCode = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Centralized error handler middleware
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.errorCode = err.errorCode || 'INTERNAL_ERROR';

  // Log error details (for debugging)
  console.error(`[${new Date().toISOString()}] ${err.statusCode} - ${err.errorCode}`, {
    message: err.message,
    path: req.path,
    method: req.method,
    userId: req.clerkId || 'anonymous',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // Production vs Development error response
  const errorResponse = {
    success: false,
    error: {
      code: err.errorCode,
      message: process.env.NODE_ENV === 'production' 
        ? (err.statusCode === 500 ? 'Internal server error' : err.message)
        : err.message,
    },
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  };

  // Add request ID for tracking
  if (req.id) {
    errorResponse.requestId = req.id;
  }

  res.status(err.statusCode).json(errorResponse);
};

// Async error wrapper - use with async route handlers
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Specific error classes for common scenarios
class ValidationError extends AppError {
  constructor(message = 'Validation failed', errors = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized access') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(message, 409, 'CONFLICT');
  }
}

module.exports = {
  AppError,
  errorHandler,
  asyncHandler,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError
};
