import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/database.js';
import { env } from '../../config/env.js';
import { LoginInput, ChangePasswordInput } from './auth.schema.js';
import { LoginResult, RefreshTokenResult, UserTokenPayload } from '../../types/auth.types.js';

export class AuthService {
  static async login(input: LoginInput): Promise<LoginResult | null> {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    const tokenPayload: UserTokenPayload = {
      userId: user.userId,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(tokenPayload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });

    const refreshToken = jwt.sign({ userId: user.userId }, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.userId,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    };
  }

  static async refreshToken(token: string): Promise<RefreshTokenResult | null> {
    try {
      const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as { userId: string };

      const user = await prisma.user.findUnique({
        where: { userId: decoded.userId },
      });

      if (!user) {
        return null;
      }

      const tokenPayload: UserTokenPayload = {
        userId: user.userId,
        email: user.email,
        role: user.role,
      };

      const newAccessToken = jwt.sign(tokenPayload, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
      });

      const newRefreshToken = jwt.sign({ userId: user.userId }, env.JWT_REFRESH_SECRET, {
        expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
      });

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch {
      return null;
    }
  }

  static async changePassword(
    userId: string,
    input: ChangePasswordInput
  ): Promise<{ success: boolean; message: string }> {
    const user = await prisma.user.findUnique({
      where: { userId },
    });

    if (!user) {
      return { success: false, message: 'Pengguna tidak ditemukan' };
    }

    const isMatch = await bcrypt.compare(input.currentPassword, user.passwordHash);
    if (!isMatch) {
      return { success: false, message: 'Password lama yang Anda masukkan salah' };
    }

    const newHash = await bcrypt.hash(input.newPassword, 10);

    await prisma.user.update({
      where: { userId },
      data: { passwordHash: newHash },
    });

    return { success: true, message: 'Password berhasil diperbarui' };
  }

  static async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { userId },
      select: {
        userId: true,
        fullName: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.userId,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    };
  }
}
