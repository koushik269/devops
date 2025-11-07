import express from 'express';
import * as authController from '../controllers/authController';
import { validate } from '../middleware/validation';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  verify2FASchema,
} from '../validators/authValidators';
import { authenticate } from '../middleware/auth';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', validate(registerSchema), authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', validate(loginSchema), authController.login);

/**
 * @route   POST /api/auth/verify-2fa
 * @desc    Verify 2FA token during login
 * @access  Public
 */
router.post('/verify-2fa', validate(verify2FASchema), authController.verify2FA);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh-token', validate(refreshTokenSchema), authController.refreshToken);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify email address
 * @access  Public
 */
router.post('/verify-email', authController.verifyEmail);

/**
 * @route   GET /api/auth/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', authenticate, authController.getProfile);

// TODO: Add password reset endpoints
// TODO: Add 2FA setup and management endpoints
// TODO: Add account management endpoints

export default router;