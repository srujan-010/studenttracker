import { Router } from 'express';
import { login, logout, getCurrentUser, registerUser } from '../controllers/authController';
import { authenticateToken, requireRole } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/login', authRateLimiter, login);
router.post('/logout', authenticateToken, logout);
router.get('/me', authenticateToken, getCurrentUser);
router.post('/register', authenticateToken, requireRole('ADMIN'), registerUser);

export default router;
