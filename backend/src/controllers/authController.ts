import { Request, Response, NextFunction } from 'express';
import { prisma } from '../index';
import { authService } from '../services/authService';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { emailService } from '../services/emailService';

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password, firstName, lastName, phoneNumber } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw createError('A user with this email already exists', 409);
    }

    // Hash password
    const passwordHash = await authService.hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        phoneNumber,
        role: 'CUSTOMER',
        status: 'PENDING',
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    // Generate email verification token
    const verificationToken = authService.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    }).accessToken;

    // Send verification email
    await emailService.sendVerificationEmail(user.email, verificationToken);

    // Log registration
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_REGISTERED',
        resourceType: 'USER',
        resourceId: user.id,
        details: { email: user.email, firstName, lastName },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      },
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password, rememberMe } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw createError('Invalid email or password', 401);
    }

    // Check password
    const isPasswordValid = await authService.comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      throw createError('Invalid email or password', 401);
    }

    // Check account status
    if (user.status === 'SUSPENDED') {
      throw createError('Account has been suspended', 403);
    }

    if (user.status === 'TERMINATED') {
      throw createError('Account has been terminated', 403);
    }

    // Generate tokens
    const tokens = authService.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Store session
    await authService.storeSession(user.id, tokens, req.ip, req.get('User-Agent'));

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Log login
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_LOGIN',
        resourceType: 'USER',
        resourceId: user.id,
        details: { email, rememberMe },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      },
    });

    const userResponse = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      twoFactorEnabled: user.twoFactorEnabled,
      lastLoginAt: user.lastLoginAt,
    };

    // If 2FA is enabled, require verification
    if (user.twoFactorEnabled) {
      res.json({
        success: true,
        message: 'Login successful. Please enter your 2FA code.',
        data: {
          user: userResponse,
          requires2FA: true,
          tempToken: tokens.accessToken, // Temporary token for 2FA verification
        },
      });
      return;
    }

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        tokens,
        requires2FA: false,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const verify2FA = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token, tempToken } = req.body;

    // Verify temp token to get user info
    let payload;
    try {
      payload = authService.verifyAccessToken(tempToken);
    } catch (error) {
      throw createError('Invalid or expired temporary token', 401);
    }

    // Get user with 2FA secret
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        emailVerified: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
        lastLoginAt: true,
      },
    });

    if (!user || !user.twoFactorSecret) {
      throw createError('2FA not set up for this account', 400);
    }

    // Verify 2FA token
    const isValidToken = authService.verify2FAToken(user.twoFactorSecret, token);
    if (!isValidToken) {
      throw createError('Invalid 2FA code', 401);
    }

    // Generate final tokens
    const tokens = authService.generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Store session
    await authService.storeSession(user.id, tokens, req.ip, req.get('User-Agent'));

    // Log successful 2FA verification
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: '2FA_VERIFIED',
        resourceType: 'USER',
        resourceId: user.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      },
    });

    res.json({
      success: true,
      message: '2FA verification successful',
      data: {
        user,
        tokens,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    const tokens = await authService.refreshSession(refreshToken);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: { tokens },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (token) {
      await authService.revokeSession(token);
    }

    if (req.user) {
      // Log logout
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'USER_LOGOUT',
          resourceType: 'USER',
          resourceId: req.user.id,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
        },
      });
    }

    res.json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token } = req.body;

    const payload = authService.verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      throw createError('Invalid verification token', 400);
    }

    if (user.emailVerified) {
      res.json({
        success: true,
        message: 'Email already verified',
      });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        status: 'ACTIVE',
      },
    });

    // Log email verification
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'EMAIL_VERIFIED',
        resourceType: 'USER',
        resourceId: user.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      },
    });

    res.json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        role: true,
        status: true,
        emailVerified: true,
        twoFactorEnabled: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw createError('User not found', 404);
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};