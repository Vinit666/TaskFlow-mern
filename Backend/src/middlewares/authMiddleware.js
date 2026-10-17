const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/apiError');

/**
 * Authentication Middleware
 * Validates JWT in Authorization header, checks expiration, and mounts user object to req.user.
 */
const authenticate = async (req, res, next) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      throw ApiError.unauthorized('No authentication token provided. Please log in.');
    }

    // Verify token signature and expiration
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'iptechie_jwt_fallback_secret_key');
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw ApiError.unauthorized('Authentication token has expired. Please log in again.');
      }
      throw ApiError.unauthorized('Invalid or malformed authentication token.');
    }

    // Verify user still exists in the database
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      throw ApiError.unauthorized('The user belonging to this session no longer exists.');
    }

    // Attach user information to request
    req.user = currentUser;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authenticate;
