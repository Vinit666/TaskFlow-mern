const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');

/**
 * 404 Not Found Middleware for unhandled routes
 */
const notFoundHandler = (req, res, next) => {
  const error = ApiError.notFound(`Cannot ${req.method} ${req.originalUrl} - Route not found.`);
  next(error);
};

/**
 * Centralized Error Handling Middleware
 * Normalizes Mongoose errors, JWT errors, and unhandled exceptions into uniform API errors.
 */
const errorHandler = (err, req, res, next) => {
  let error = err;

  // If error is not an instance of ApiError, normalize it
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || (error instanceof Error ? 500 : 400);
    let message = error.message || 'Internal Server Error';
    let errors = [];

    // Handle Mongoose duplicate key error (code 11000)
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue || {})[0] || 'field';
      message = `Duplicate field value entered: ${field}. Please use another value.`;
      error = new ApiError(409, message);
    }
    // Handle Mongoose validation errors
    else if (error.name === 'ValidationError') {
      errors = Object.values(error.errors || {}).map((val) => val.message);
      message = errors.length > 0 ? errors.join(', ') : 'Validation failed';
      error = new ApiError(400, message, errors);
    }
    // Handle Mongoose bad ObjectId / CastError
    else if (error.name === 'CastError') {
      message = `Invalid format for resource identifier '${error.path}': ${error.value}`;
      error = new ApiError(400, message);
    }
    // Handle JWT expiration
    else if (error.name === 'TokenExpiredError') {
      message = 'Your session has expired. Please log in again.';
      error = new ApiError(401, message);
    }
    // Handle JWT malformed token
    else if (error.name === 'JsonWebTokenError') {
      message = 'Invalid authentication token. Please log in again.';
      error = new ApiError(401, message);
    } else {
      error = new ApiError(statusCode, message, errors, err.stack);
    }
  }

  // Log error for debugging
  if (error.statusCode >= 500) {
    logger.error(`[500 Server Error] ${req.method} ${req.originalUrl}:`, error);
  } else {
    logger.warn(`[${error.statusCode} Client Error] ${req.method} ${req.originalUrl}: ${error.message}`);
  }

  // Format clean response envelope
  const response = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    errors: error.errors && error.errors.length > 0 ? error.errors : undefined,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  };

  return res.status(error.statusCode).json(response);
};

module.exports = {
  notFoundHandler,
  errorHandler
};
