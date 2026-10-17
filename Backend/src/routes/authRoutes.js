const express = require('express');
const { register, login, getMe, logout } = require('../controllers/authController');
const authenticate = require('../middlewares/authMiddleware');
const { validateBody } = require('../middlewares/validateMiddleware');
const { validateRegisterInput, validateLoginInput } = require('../utils/validators');

const router = express.Router();

// Public routes
router.post('/register', validateBody(validateRegisterInput), register);
router.post('/login', validateBody(validateLoginInput), login);
router.post('/logout', logout);

// Protected routes
router.get('/me', authenticate, getMe);

module.exports = router;
