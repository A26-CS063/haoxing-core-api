import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { authenticateJWT } from '../../middlewares/auth.middleware.js';
import { authLimiter } from '../../middlewares/rateLimit.middleware.js';

const router = Router();

// Public routes
router.post('/login', authLimiter, AuthController.login);
router.post('/refresh', AuthController.refreshToken);
router.post('/logout', AuthController.logout);

// Protected routes
router.get('/me', authenticateJWT, AuthController.getMe);
router.patch('/change-password', authenticateJWT, AuthController.changePassword);

export default router;
