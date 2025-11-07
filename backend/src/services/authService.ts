import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import { prisma } from '../index';
import { createError } from '../middleware/errorHandler';

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  private readonly jwtSecret: string;
  private readonly jwtRefreshSecret: string;
  private readonly jwtExpiresIn: string;
  private readonly jwtRefreshExpiresIn: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET!;
    this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET!;
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '15m';
    this.jwtRefreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

    if (!this.jwtSecret || !this.jwtRefreshSecret) {
      throw new Error('JWT secrets are not configured');
    }
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    return bcrypt.hash(password, saltRounds);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  generateTokens(payload: JWTPayload): AuthTokens {
    const accessToken = jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn,
    });

    const refreshToken = jwt.sign(payload, this.jwtRefreshSecret, {
      expiresIn: this.jwtRefreshExpiresIn,
    });

    return { accessToken, refreshToken };
  }

  verifyAccessToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, this.jwtSecret) as JWTPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw createError('Access token expired', 401);
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw createError('Invalid access token', 401);
      }
      throw error;
    }
  }

  verifyRefreshToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, this.jwtRefreshSecret) as JWTPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw createError('Refresh token expired', 401);
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw createError('Invalid refresh token', 401);
      }
      throw error;
    }
  }

  async storeSession(userId: string, tokens: AuthTokens, ipAddress?: string, userAgent?: string): Promise<void> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.parseTimeToMs(this.jwtExpiresIn));
    const refreshExpiresAt = new Date(now.getTime() + this.parseTimeToMs(this.jwtRefreshExpiresIn));

    await prisma.session.create({
      data: {
        userId,
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt,
        refreshExpiresAt,
        ipAddress,
        userAgent,
      },
    });
  }

  async refreshSession(refreshToken: string): Promise<AuthTokens> {
    const payload = this.verifyRefreshToken(refreshToken);

    const session = await prisma.session.findUnique({
      where: { refreshToken },
      include: { user: true },
    });

    if (!session || session.refreshExpiresAt < new Date()) {
      throw createError('Session expired', 401);
    }

    if (session.user.status !== 'ACTIVE') {
      throw createError('Account is not active', 401);
    }

    // Delete old session
    await prisma.session.delete({ where: { id: session.id } });

    // Generate new tokens
    const newTokens = this.generateTokens({
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    });

    // Store new session
    await this.storeSession(payload.userId, newTokens);

    return newTokens;
  }

  async revokeSession(token: string): Promise<void> {
    await prisma.session.deleteMany({ where: { token } });
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    await prisma.session.deleteMany({ where: { userId } });
  }

  generate2FASecret(userEmail: string): { secret: string; qrCode: string } {
    const secret = speakeasy.generateSecret({
      name: `VPS Portal (${userEmail})`,
      issuer: 'VPS Seller Portal',
    });

    return {
      secret: secret.base32!,
      qrCode: secret.otpauth_url!,
    };
  }

  async generate2FAQRCode(otpauthUrl: string): Promise<string> {
    return qrcode.toDataURL(otpauthUrl);
  }

  verify2FAToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 steps before/after for time drift
    });
  }

  private parseTimeToMs(timeString: string): number {
    const unit = timeString.slice(-1);
    const value = parseInt(timeString.slice(0, -1));

    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: throw new Error(`Invalid time format: ${timeString}`);
    }
  }
}

export const authService = new AuthService();