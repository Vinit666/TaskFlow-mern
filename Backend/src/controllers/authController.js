const AuthService = require('../services/authService');
const ApiResponse = require('../utils/apiResponse');

/**
 * Controller handling user registration
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const result = await AuthService.registerUser(req.body);
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
    const result = await AuthService.loginUser(req.body);
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
 * Controller handling user logout (stateless token clearance indicator)
 * POST /api/auth/logout
 */
const logout = async (req, res) => {
  return ApiResponse.success(res, null, 'Logged out successfully');
};

module.exports = {
  register,
  login,
  getMe,
  logout
};
