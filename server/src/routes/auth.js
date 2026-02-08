import express from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, getMe, updateProfile } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const authRateLimitEnabled = process.env.NODE_ENV === 'production'
  ? process.env.AUTH_RATE_LIMIT_ENABLED !== 'false'
  : process.env.AUTH_RATE_LIMIT_ENABLED === 'true';
const loginLimiter = rateLimit({
  windowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.AUTH_RATE_LIMIT_MAX) || 100,
  skipSuccessfulRequests: true,
  message: 'Too many failed login attempts, please try again later'
});

router.post('/register', register);
router.post('/login', authRateLimitEnabled ? loginLimiter : (req, res, next) => next(), login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

export default router;
