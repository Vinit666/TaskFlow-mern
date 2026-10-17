const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const EmailService = require('./emailService');
const logger = require('../utils/logger');

/**
 * Generates a signed JSON Web Token
 * @param {Object} user - User document
 * @returns {string} Signed JWT
 */
const signToken = (user) => {
  const secret = process.env.JWT_SECRET || 'iptechie_jwt_fallback_secret_key';
  const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
  return jwt.sign(
    {
      id: user._id,
      email: user.email
    },
    secret,
    { expiresIn }
  );
};

class AuthService {
  /**
   * Registers a new user, hashes password, issues JWT, and triggers welcome email
   * @param {Object} userData - { name, email, password }
   * @returns {Promise<Object>} { user, token }
   */
  static async registerUser({ name, email, password }) {
    const normalizedEmail = email.toLowerCase().trim();

    // Check for duplicate email
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw ApiError.conflict('An account with this email address already exists.');
    }

    // Create user (password is automatically hashed by Mongoose pre-save hook)
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password
    });

    // Generate JWT
    const token = signToken(user);

    // Send Welcome Email asynchronously via Brevo (fire-and-forget, non-blocking)
    EmailService.sendWelcomeEmail(user).catch((err) => {
      logger.error('Failed to trigger Brevo welcome email:', err.message);
    });

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      },
      token
    };
  }

  /**
   * Authenticates user credentials and issues a new JWT token
   * @param {Object} credentials - { email, password }
   * @returns {Promise<Object>} { user, token }
   */
  static async loginUser({ email, password }) {
    const normalizedEmail = email.toLowerCase().trim();

    // Explicitly select password field since schema sets select: false
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      // Use generic error message to prevent account enumeration attacks
      throw ApiError.unauthorized('Invalid email or password.');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password.');
    }

    const token = signToken(user);

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      },
      token
    };
  }

  /**
   * Retrieves profile for currently authenticated user
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  static async getCurrentUserProfile(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User profile not found.');
    }
    return user;
  }
}

module.exports = AuthService;
