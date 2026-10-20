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
 * Helper to determine if an error is caused by lost network connection, DNS failure, or DB connectivity failure
 */
const isNetworkOrConnectionError = (err) => {
  if (!err) return false;
  const code = err.code || err.cause?.code;
  const name = err.name || err.cause?.name;
  const message = `${err.message || ''} ${err.cause?.message || ''}`;

  const networkCodes = [
    'ENOTFOUND',
    'ECONNREFUSED',
    'ECONNRESET',
    'ETIMEDOUT',
    'EHOSTUNREACH',
    'ENETUNREACH',
    'EAI_AGAIN',
    'EADDRNOTAVAIL'
  ];

  if (networkCodes.includes(code)) return true;

  const networkErrorNames = [
    'MongooseServerSelectionError',
    'MongoNetworkError',
    'MongoServerSelectionError',
    'MongoTimeoutError',
    'MongoNetworkTimeoutError'
  ];

  if (networkErrorNames.includes(name)) return true;

  const networkKeywords = [
    'getaddrinfo',
    'enotfound',
    'econnrefused',
    'econnreset',
    'etimedout',
    'querysrv',
    'server selection timed out',
    'topology was destroyed',
    'buffering timed out',
    'mongonetworkerror',
    'failed to connect to server',
    'mongodb.net'
  ];

  const lowerMsg = message.toLowerCase();
  return networkKeywords.some((keyword) => lowerMsg.includes(keyword));
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

    // Handle Multer file upload errors
    if (error.code === 'LIMIT_FILE_SIZE') {
      message = 'Profile photo too large. File size must be less than 5 MB.';
      error = new ApiError(400, message);
    } else if (error.name === 'MulterError') {
      message = `File upload error: ${error.message}`;
      error = new ApiError(400, message);
    }
    // Handle Mongoose duplicate key error (code 11000)
    else if (error.code === 11000) {
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
    }
    // Handle Network / DNS / Database connectivity failures
    else if (isNetworkOrConnectionError(error)) {
      message = 'Network connection error. Please check your internet connection and try again.';
      error = new ApiError(503, message);
    } else {
      error = new ApiError(statusCode, message, errors, err.stack);
    }
  }

  // Double check if error message or underlying cause is a network / DB connection failure even if wrapped
  const isNetworkErr = isNetworkOrConnectionError(err) || isNetworkOrConnectionError(error);
  if (isNetworkErr) {
    error = new ApiError(503, 'Network connection error. Please check your internet connection and try again.');
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
    ...(process.env.NODE_ENV === 'development' && !isNetworkErr && { stack: error.stack })
  };

  return res.status(error.statusCode).json(response);
};

module.exports = {
  notFoundHandler,
  errorHandler
};
