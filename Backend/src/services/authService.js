const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
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

// In-memory map to hold grace period timers for session leaves
const pendingSessionCloses = new Map();

class AuthService {
  /**
   * Schedules delayed session termination on window/tab leave.
   * If a page refresh occurs, cancelSessionLeave will cancel this timer within milliseconds.
   * If the tab was closed, this timer executes after 5 seconds and finalizes logoutAt.
   */
  static scheduleSessionLeave(sessionId, { durationSeconds, leaveTime } = {}) {
    if (!sessionId) return;

    if (pendingSessionCloses.has(sessionId)) {
      clearTimeout(pendingSessionCloses.get(sessionId));
      pendingSessionCloses.delete(sessionId);
    }

    const exitTimestamp = leaveTime ? new Date(leaveTime) : new Date();

    const timer = setTimeout(async () => {
      pendingSessionCloses.delete(sessionId);
      try {
        await AuthService.finalizeSessionLeave(sessionId, {
          durationSeconds,
          leaveTime: exitTimestamp
        });
      } catch (err) {
        logger.error('Failed to finalize session close on tab leave:', err.message);
      }
    }, 5000);

    pendingSessionCloses.set(sessionId, timer);
  }

  /**
   * Cancels a pending session leave timer (called when a page refreshes/resumes)
   */
  static cancelSessionLeave(sessionId) {
    if (!sessionId) return;
    if (pendingSessionCloses.has(sessionId)) {
      clearTimeout(pendingSessionCloses.get(sessionId));
      pendingSessionCloses.delete(sessionId);
    }
  }

  /**
   * Finalizes session closure when tab close is confirmed after grace period
   */
  static async finalizeSessionLeave(sessionId, { durationSeconds, leaveTime } = {}) {
    if (!sessionId) return;
    const user = await User.findOne({ 'sessions.sessionId': sessionId });
    if (!user || !user.sessions) return;

    const session = user.sessions.find((s) => s.sessionId === sessionId);
    if (!session || !session.isActive) return;

    const exitDate = leaveTime && !isNaN(new Date(leaveTime).getTime()) ? new Date(leaveTime) : new Date();
    const loginTime = session.loginAt ? new Date(session.loginAt).getTime() : exitDate.getTime();
    const calculatedSecs = Math.max(0, Math.floor((exitDate.getTime() - loginTime) / 1000));
    const finalDuration = Math.max(
      session.durationSeconds || 0,
      typeof durationSeconds === 'number' && durationSeconds > 0 ? durationSeconds : calculatedSecs
    );
    const addedSeconds = Math.max(0, finalDuration - (session.durationSeconds || 0));

    session.isActive = false;
    session.logoutAt = exitDate;
    session.durationSeconds = finalDuration;
    user.totalSessionTime = (user.totalSessionTime || 0) + addedSeconds;

    await user.save();
    logger.info(`Session ${sessionId} finalized on tab closure at ${exitDate.toISOString()}. Duration: ${finalDuration}s`);
  }
  /**
   * Registers a new user, hashes password, issues JWT, and triggers welcome email
   * @param {Object} userData - { name, email, password }
   * @param {Object} meta - { ipAddress, userAgent }
   * @returns {Promise<Object>} { user, token, sessionId }
   */
  static async registerUser({ name, email, password }, meta = {}) {
    const normalizedEmail = email.toLowerCase().trim();

    // Check for duplicate email
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw ApiError.conflict('An account with this email address already exists.');
    }

    const sessionId = new mongoose.Types.ObjectId().toString();
    const now = new Date();

    // Create user (password is automatically hashed by Mongoose pre-save hook)
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      loginCount: 1,
      lastLoginAt: now,
      totalSessionTime: 0,
      sessions: [
        {
          sessionId,
          loginAt: now,
          ipAddress: meta.ipAddress || '',
          userAgent: meta.userAgent || '',
          isActive: true,
          durationSeconds: 0
        }
      ]
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
        avatar: user.avatar || '',
        loginCount: user.loginCount || 1,
        lastLoginAt: user.lastLoginAt,
        totalSessionTime: user.totalSessionTime || 0,
        sessions: user.sessions || [],
        createdAt: user.createdAt
      },
      sessionId,
      token
    };
  }

  /**
   * Authenticates user credentials and issues a new JWT token
   * @param {Object} credentials - { email, password }
   * @param {Object} meta - { ipAddress, userAgent }
   * @returns {Promise<Object>} { user, token, sessionId }
   */
  static async loginUser({ email, password }, meta = {}) {
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
    const sessionId = new mongoose.Types.ObjectId().toString();
    const now = new Date();

    user.loginCount = (user.loginCount || 0) + 1;
    user.lastLoginAt = now;

    if (!user.sessions) user.sessions = [];

    // Ensure all previous sessions are marked inactive and their duration is finalized
    user.sessions.forEach((s) => {
      if (s.isActive) {
        s.isActive = false;
        if (!s.logoutAt) {
          s.logoutAt = now;
        }
        const loginTime = s.loginAt ? new Date(s.loginAt).getTime() : now.getTime();
        const calculatedDuration = Math.max(s.durationSeconds || 0, Math.floor((new Date(s.logoutAt).getTime() - loginTime) / 1000));
        const addedSeconds = Math.max(0, calculatedDuration - (s.durationSeconds || 0));
        s.durationSeconds = calculatedDuration;
        user.totalSessionTime = (user.totalSessionTime || 0) + addedSeconds;
      }
    });

    user.sessions.unshift({
      sessionId,
      loginAt: now,
      logoutAt: null,
      ipAddress: meta.ipAddress || '',
      userAgent: meta.userAgent || '',
      isActive: true,
      durationSeconds: 0
    });

    // Keep up to 20 recent sessions to prevent unbounded array growth
    if (user.sessions.length > 20) {
      user.sessions = user.sessions.slice(0, 20);
    }

    await user.save();

    return {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || '',
        loginCount: user.loginCount,
        lastLoginAt: user.lastLoginAt,
        totalSessionTime: user.totalSessionTime || 0,
        sessions: user.sessions,
        createdAt: user.createdAt
      },
      sessionId,
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

    let modified = false;
    const now = new Date();

    if (user.sessions && user.sessions.length > 0) {
      // Cancel any pending leave timer for active sessions (refresh confirmed)
      user.sessions.forEach((s) => {
        if (s.isActive) {
          AuthService.cancelSessionLeave(s.sessionId);
        }
      });

      // Auto-heal: Ensure older sessions (index > 0) are marked inactive and duration calculated
      for (let i = 1; i < user.sessions.length; i++) {
        const s = user.sessions[i];
        if (s.isActive) {
          s.isActive = false;
          if (!s.logoutAt) s.logoutAt = now;
          const startMs = s.loginAt ? new Date(s.loginAt).getTime() : now.getTime();
          const endMs = new Date(s.logoutAt).getTime();
          const durSec = Math.max(0, Math.floor((endMs - startMs) / 1000));
          const added = Math.max(0, durSec - (s.durationSeconds || 0));
          s.durationSeconds = durSec;
          user.totalSessionTime = (user.totalSessionTime || 0) + added;
          modified = true;
        }
      }

      // Historical repair: fix inactive sessions that had 0 duration but have loginAt & logoutAt
      for (let i = 0; i < user.sessions.length; i++) {
        const s = user.sessions[i];
        if (!s.isActive && s.logoutAt && s.loginAt && (!s.durationSeconds || s.durationSeconds === 0)) {
          const startMs = new Date(s.loginAt).getTime();
          const endMs = new Date(s.logoutAt).getTime();
          if (endMs > startMs) {
            const durSec = Math.max(0, Math.floor((endMs - startMs) / 1000));
            s.durationSeconds = durSec;
            user.totalSessionTime = (user.totalSessionTime || 0) + durSec;
            modified = true;
          }
        }
      }

      // If user returned after previous tab close (no active session), create a new active session
      const hasActive = user.sessions.some((s) => s.isActive);
      if (!hasActive) {
        const newSessionId = new mongoose.Types.ObjectId().toString();
        user.sessions.unshift({
          sessionId: newSessionId,
          loginAt: now,
          logoutAt: null,
          durationSeconds: 0,
          isActive: true,
          ipAddress: '',
          userAgent: ''
        });
        if (user.sessions.length > 20) {
          user.sessions = user.sessions.slice(0, 20);
        }
        modified = true;
      }

      if (modified) {
        await user.save();
      }
    } else {
      // If sessions array is completely empty, initialize first session
      const newSessionId = new mongoose.Types.ObjectId().toString();
      user.sessions = [
        {
          sessionId: newSessionId,
          loginAt: now,
          logoutAt: null,
          durationSeconds: 0,
          isActive: true,
          ipAddress: '',
          userAgent: ''
        }
      ];
      await user.save();
    }

    return user;
  }

  /**
   * Closes active user session on logout and finalizes duration
   * @param {string} userId
   * @param {string} sessionId
   */
  static async logoutUser(userId, sessionId) {
    if (sessionId) {
      AuthService.cancelSessionLeave(sessionId);
    }
    let user = null;
    if (userId) {
      user = await User.findById(userId);
    }
    if (!user && sessionId) {
      user = await User.findOne({ 'sessions.sessionId': sessionId });
    }
    if (!user || !user.sessions) return null;

    const now = new Date();
    let modified = false;

    user.sessions.forEach((s) => {
      if ((sessionId && s.sessionId === sessionId) || (!sessionId && s.isActive)) {
        s.isActive = false;
        s.logoutAt = now;
        const loginTime = s.loginAt ? new Date(s.loginAt).getTime() : now.getTime();
        const calculatedSeconds = Math.max(0, Math.floor((now.getTime() - loginTime) / 1000));
        const finalDuration = Math.max(s.durationSeconds || 0, calculatedSeconds);
        const addedSeconds = Math.max(0, finalDuration - (s.durationSeconds || 0));
        s.durationSeconds = finalDuration;
        user.totalSessionTime = (user.totalSessionTime || 0) + addedSeconds;
        modified = true;
      }
    });

    if (modified) {
      await user.save();
    }
    return user;
  }

  /**
   * Updates user profile (name and/or avatar photo)
   * @param {string} userId
   * @param {Object} updateData - { name, avatarPath }
   * @returns {Promise<Object>}
   */
  static async updateUserProfile(userId, { name, avatarPath }) {
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User profile not found.');
    }

    if (name !== undefined) {
      const trimmedName = name.trim();
      if (trimmedName.length < 2) {
        throw ApiError.badRequest('Name must be at least 2 characters long.');
      }
      if (trimmedName.length > 50) {
        throw ApiError.badRequest('Name cannot exceed 50 characters.');
      }
      user.name = trimmedName;
    }

    if (avatarPath !== undefined) {
      user.avatar = avatarPath;
    }

    await user.save();

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar || '',
      loginCount: user.loginCount || 0,
      lastLoginAt: user.lastLoginAt,
      totalSessionTime: user.totalSessionTime || 0,
      sessions: user.sessions || [],
      createdAt: user.createdAt
    };
  }

  /**
   * Records session heartbeat/duration sync and updates total time logged in
   * @param {string} userId
   * @param {Object} param - { sessionId, durationSeconds, isClosing }
   * @returns {Promise<Object>}
   */
  static async recordSessionHeartbeat(userId, { sessionId, durationSeconds, isClosing = false }) {
    if (!sessionId) {
      return { totalSessionTime: 0, activeSession: null };
    }

    AuthService.cancelSessionLeave(sessionId);

    try {
      let user = null;
      if (userId) {
        user = await User.findById(userId).select('sessions totalSessionTime');
      }
      if (!user && sessionId) {
        user = await User.findOne({ 'sessions.sessionId': sessionId }).select('sessions totalSessionTime');
      }

      if (!user || !user.sessions) {
        return { totalSessionTime: 0, activeSession: null };
      }

      const session = user.sessions.find((s) => s.sessionId === sessionId);
      if (session) {
        const now = new Date();
        const calculatedDuration = Math.max(
          0,
          Math.floor((now.getTime() - new Date(session.loginAt).getTime()) / 1000)
        );
        const newDuration =
          typeof durationSeconds === 'number' && durationSeconds > 0
            ? Math.max(session.durationSeconds || 0, durationSeconds)
            : Math.max(session.durationSeconds || 0, calculatedDuration);

        const addedSeconds = Math.max(0, newDuration - (session.durationSeconds || 0));

        const updateDoc = {
          $inc: { totalSessionTime: addedSeconds },
          $set: { 'sessions.$.durationSeconds': newDuration }
        };

        if (isClosing) {
          updateDoc.$set['sessions.$.isActive'] = false;
          updateDoc.$set['sessions.$.logoutAt'] = now;
        }

        await User.updateOne(
          { _id: user._id, 'sessions.sessionId': sessionId },
          updateDoc
        );

        return {
          totalSessionTime: (user.totalSessionTime || 0) + addedSeconds,
          activeSession: {
            ...session.toObject(),
            durationSeconds: newDuration,
            isActive: !isClosing,
            logoutAt: isClosing ? now : session.logoutAt
          }
        };
      }

      return {
        totalSessionTime: user.totalSessionTime || 0,
        activeSession: null
      };
    } catch (err) {
      // Safe non-blocking fallback
      return { totalSessionTime: 0, activeSession: null };
    }
  }

  /**
   * Initiates forgot password flow by generating a 6-digit OTP and emailing it via Brevo
   * @param {string} email
   * @returns {Promise<Object>}
   */
  static async forgotPassword(email) {
    if (!email || typeof email !== 'string') {
      throw ApiError.badRequest('Please provide a valid email address.');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // Do not disclose whether email exists
      return {
        message: 'If an account with that email exists, an OTP code has been sent to your email.'
      };
    }

    // Generate secure 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.resetPasswordOtp = otp;
    user.resetPasswordExpires = expiresAt;
    await user.save({ validateBeforeSave: false });

    // Send OTP email via Brevo asynchronously
    EmailService.sendPasswordResetOtpEmail(user, otp).catch((err) => {
      logger.error('Failed to send Brevo password reset OTP email:', err.message);
    });

    return {
      message: 'Password reset OTP sent to your email address.'
    };
  }

  /**
   * Verifies whether the provided OTP is valid and unexpired
   * @param {Object} param - { email, otp }
   * @returns {Promise<Object>}
   */
  static async verifyOtp({ email, otp }) {
    if (!email || !otp) {
      throw ApiError.badRequest('Email and OTP verification code are required.');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+resetPasswordOtp +resetPasswordExpires');

    if (
      !user ||
      !user.resetPasswordOtp ||
      user.resetPasswordOtp !== otp.trim() ||
      !user.resetPasswordExpires ||
      user.resetPasswordExpires < new Date()
    ) {
      throw ApiError.badRequest('Invalid or expired OTP verification code.');
    }

    return {
      success: true,
      message: 'OTP verified successfully.'
    };
  }

  /**
   * Resets the user password using verified OTP
   * @param {Object} param - { email, otp, newPassword }
   * @returns {Promise<Object>}
   */
  static async resetPassword({ email, otp, newPassword }) {
    if (!email || !otp || !newPassword) {
      throw ApiError.badRequest('Email, OTP code, and new password are required.');
    }

    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      throw ApiError.badRequest('New password must be at least 6 characters long.');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+password +resetPasswordOtp +resetPasswordExpires');

    if (
      !user ||
      !user.resetPasswordOtp ||
      user.resetPasswordOtp !== otp.trim() ||
      !user.resetPasswordExpires ||
      user.resetPasswordExpires < new Date()
    ) {
      throw ApiError.badRequest('Invalid or expired OTP verification code.');
    }

    user.password = newPassword;
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    return {
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.'
    };
  }
}

module.exports = AuthService;
