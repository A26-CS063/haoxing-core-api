import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { AuthService } from '../auth.service.js';
import { env } from '../../../config/env.js';

// Mock Prisma client
vi.mock('../../../config/database.js', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Import mocked prisma after mock declaration
import { prisma } from '../../../config/database.js';

const mockUser = {
  userId: 'user-uuid-123',
  fullName: 'Admin Haoxing',
  email: 'admin@haoxing.id',
  role: 'admin' as const,
  passwordHash: await bcrypt.hash('haoxing2026', 10),
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login()', () => {
    it('should return null when user is not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const result = await AuthService.login({
        email: 'nonexistent@haoxing.id',
        password: 'password123',
      });

      expect(result).toBeNull();
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'nonexistent@haoxing.id' },
      });
    });

    it('should return null when password is incorrect', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      const result = await AuthService.login({
        email: 'admin@haoxing.id',
        password: 'wrongpassword',
      });

      expect(result).toBeNull();
    });

    it('should return tokens and user profile on valid credentials', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      const result = await AuthService.login({
        email: 'admin@haoxing.id',
        password: 'haoxing2026',
      });

      expect(result).not.toBeNull();
      expect(result?.accessToken).toBeDefined();
      expect(result?.refreshToken).toBeDefined();
      expect(result?.user).toEqual({
        id: 'user-uuid-123',
        fullName: 'Admin Haoxing',
        email: 'admin@haoxing.id',
        role: 'admin',
      });
    });
  });

  describe('refreshToken()', () => {
    it('should return null on invalid token', async () => {
      const result = await AuthService.refreshToken('invalid.token.string');

      expect(result).toBeNull();
    });

    it('should return null when user no longer exists', async () => {
      const validRefreshToken = jwt.sign({ userId: 'deleted-user-id' }, env.JWT_REFRESH_SECRET, {
        expiresIn: '7d',
      });
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const result = await AuthService.refreshToken(validRefreshToken);

      expect(result).toBeNull();
    });

    it('should return new token pair on valid refresh token', async () => {
      const validRefreshToken = jwt.sign({ userId: mockUser.userId }, env.JWT_REFRESH_SECRET, {
        expiresIn: '7d',
      });
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      const result = await AuthService.refreshToken(validRefreshToken);

      expect(result).not.toBeNull();
      expect(result?.accessToken).toBeDefined();
      expect(result?.refreshToken).toBeDefined();
    });
  });

  describe('changePassword()', () => {
    it('should return failure when user is not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const result = await AuthService.changePassword('nonexistent-id', {
        currentPassword: 'haoxing2026',
        newPassword: 'newPassword123',
        confirmNewPassword: 'newPassword123',
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Pengguna tidak ditemukan');
    });

    it('should return failure when current password is wrong', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      const result = await AuthService.changePassword(mockUser.userId, {
        currentPassword: 'wrongPassword',
        newPassword: 'newPassword123',
        confirmNewPassword: 'newPassword123',
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Password lama yang Anda masukkan salah');
    });

    it('should update password and return success on valid input', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.user.update).mockResolvedValue(mockUser);

      const result = await AuthService.changePassword(mockUser.userId, {
        currentPassword: 'haoxing2026',
        newPassword: 'newSecurePassword123',
        confirmNewPassword: 'newSecurePassword123',
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Password berhasil diperbarui');
      expect(prisma.user.update).toHaveBeenCalledOnce();
    });
  });

  describe('getProfile()', () => {
    it('should return null when user is not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const result = await AuthService.getProfile('nonexistent-id');

      expect(result).toBeNull();
    });

    it('should return user profile on valid userId', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      const result = await AuthService.getProfile(mockUser.userId);

      expect(result).toEqual({
        id: 'user-uuid-123',
        fullName: 'Admin Haoxing',
        email: 'admin@haoxing.id',
        role: 'admin',
      });
    });
  });
});
