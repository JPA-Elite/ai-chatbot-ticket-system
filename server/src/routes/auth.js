import express from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  skipSuccessfulRequests: true,
  message: 'Too many failed login attempts, please try again later'
});

router.post('/register', register);
router.post('/login', loginLimiter, login);
router.get('/me', protect, getMe);

export default router;