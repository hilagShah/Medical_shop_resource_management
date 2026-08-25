const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { loginUser, getMe } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

// Rate limiting for authentication endpoint: 10 attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Too many login attempts from this IP. Please try again after 15 minutes.',
  },
});

router.post('/login', loginLimiter, loginUser);
router.get('/me', protect, getMe);

module.exports = router;
