const jwt = require('jsonwebtoken');
const AuthService = require('../services/authService');
const ApiResponse = require('../utils/apiResponse');

/**
 * Controller handling user registration
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const meta = {
      ipAddress: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || '',
      userAgent: req.headers['user-agent'] || ''
    };
    const result = await AuthService.registerUser(req.body, meta);
    return ApiResponse.created(res, result, 'User registered successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Controller handling user login
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const meta = {
      ipAddress: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || '',
      userAgent: req.headers['user-agent'] || ''
    };
    const result = await AuthService.loginUser(req.body, meta);
    return ApiResponse.success(res, result, 'Logged in successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Controller retrieving current user profile
 * GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    const user = await AuthService.getCurrentUserProfile(req.user._id);
    return ApiResponse.success(res, { user }, 'User profile fetched successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Controller syncing active session heartbeat/duration
 * POST /api/auth/session-heartbeat
 */
const sessionHeartbeat = async (req, res, next) => {
  try {
    const { sessionId, durationSeconds, isClosing } = req.body;
    let userId = req.user ? req.user._id : null;
    if (!userId && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      const token = req.headers.authorization.split(' ')[1];
      try {
        const decoded = jwt.decode(token);
        if (decoded && decoded.id) userId = decoded.id;
      } catch (e) {
        // Safe fallback
      }
    }
    const result = await AuthService.recordSessionHeartbeat(userId, {
      sessionId,
      durationSeconds,
      isClosing: Boolean(isClosing)
    });
    return ApiResponse.success(res, result, 'Session synced successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Controller handling user logout (stateless token clearance indicator and session closure)
 * POST /api/auth/logout
 */
const logout = async (req, res) => {
  try {
    let userId = req.user ? req.user._id : null;
    const authHeader = req.headers.authorization;
    if (!userId && authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.decode(token);
        if (decoded && decoded.id) {
          userId = decoded.id;
        }
      } catch (e) {
        // Safe fallback
      }
    }
    await AuthService.logoutUser(userId, req.body?.sessionId);
  } catch (err) {
    // Non-blocking logout error
  }
  return ApiResponse.success(res, null, 'Logged out successfully');
};

/**
 * Controller handling user profile update (name and/or avatar photo)
 * PUT /api/auth/profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const avatarPath = req.file ? `/uploads/avatars/${req.file.filename}` : undefined;
    const result = await AuthService.updateUserProfile(req.user._id, {
      name: req.body.name,
      avatarPath
    });
    return ApiResponse.success(res, { user: result }, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Controller initiating password reset OTP via Brevo
 * POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res, next) => {
  try {
    const result = await AuthService.forgotPassword(req.body.email);
    return ApiResponse.success(res, result, result.message);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller verifying password reset OTP
 * POST /api/auth/verify-otp
 */
const verifyOtp = async (req, res, next) => {
  try {
    const result = await AuthService.verifyOtp(req.body);
    return ApiResponse.success(res, result, result.message);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller resetting password with verified OTP
 * POST /api/auth/reset-password
 */
const resetPassword = async (req, res, next) => {
  try {
    const result = await AuthService.resetPassword(req.body);
    return ApiResponse.success(res, result, result.message);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller scheduling candidate session closure on tab/window unload
 * POST /api/auth/session-leave
 */
const sessionLeave = async (req, res, next) => {
  try {
    const { sessionId, durationSeconds, leaveTime } = req.body;
    if (sessionId) {
      AuthService.scheduleSessionLeave(sessionId, { durationSeconds, leaveTime });
    }
    return ApiResponse.success(res, null, 'Session leave scheduled');
  } catch (error) {
    next(error);
  }
};

/**
 * Controller cancelling candidate session closure on page reload / resume
 * POST /api/auth/session-resume
 */
const sessionResume = async (req, res, next) => {
  try {
    const { sessionId } = req.body;
    if (sessionId) {
      AuthService.cancelSessionLeave(sessionId);
    }
    return ApiResponse.success(res, null, 'Session resumed');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  logout,
  updateProfile,
  forgotPassword,
  verifyOtp,
  resetPassword,
  sessionHeartbeat,
  sessionLeave,
  sessionResume
};
