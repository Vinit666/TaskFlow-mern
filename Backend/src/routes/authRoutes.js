const express = require('express');
const {
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
} = require('../controllers/authController');
const authenticate = require('../middlewares/authMiddleware');
const { validateBody } = require('../middlewares/validateMiddleware');
const { validateRegisterInput, validateLoginInput } = require('../utils/validators');
const { uploadAvatar } = require('../middlewares/uploadMiddleware');

const router = express.Router();

// Public routes
router.post('/register', validateBody(validateRegisterInput), register);
router.post('/login', validateBody(validateLoginInput), login);
router.post('/logout', logout);
router.post('/session-leave', sessionLeave);
router.post('/session-resume', sessionResume);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, uploadAvatar.single('avatar'), updateProfile);
router.post('/session-heartbeat', authenticate, sessionHeartbeat);

module.exports = router;
