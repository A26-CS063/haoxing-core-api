import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '../../../config/env.js';

// Mock Prisma before importing app
vi.mock('../../../config/database.js', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $queryRaw: vi.fn(),
  },
}));

// Mock Redis to prevent connection attempts during tests
vi.mock('../../../config/redis.js', () => ({
  redisClient: null,
  isRedisConnected: false,
}));

import app from '../../../app.js';
import { prisma } from '../../../config/database.js';

const mockPasswordHash = await bcrypt.hash('haoxing2026', 10);

const mockAdminUser = {
  userId: 'admin-uuid-123',
  fullName: 'Admin Haoxing',
  email: 'admin@haoxing.id',
  role: 'admin' as const,
  passwordHash: mockPasswordHash,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('Auth API Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- POST /api/v1/auth/login ---
  describe('POST /api/v1/auth/login', () => {
    it('should return 200 with tokens on valid admin login', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockAdminUser);

      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'admin@haoxing.id',
        password: 'haoxing2026',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Login berhasil');
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.user.email).toBe('admin@haoxing.id');
      expect(res.body.data.user.role).toBe('admin');
    });

    it('should return 400 on empty body', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Validasi login gagal');
      expect(res.body.errors).toBeDefined();
    });

    it('should return 400 on invalid email format', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'bukan-email',
        password: 'password123',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 on wrong credentials', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockAdminUser);

      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'admin@haoxing.id',
        password: 'wrongpassword',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Email atau password yang Anda masukkan salah');
    });

    it('should return 401 when user does not exist', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      const res = await request(app).post('/api/v1/auth/login').send({
        email: 'ghost@haoxing.id',
        password: 'password123',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // --- POST /api/v1/auth/refresh ---
  describe('POST /api/v1/auth/refresh', () => {
    it('should return 200 with new token pair on valid refresh token', async () => {
      const validRefreshToken = jwt.sign({ userId: mockAdminUser.userId }, env.JWT_REFRESH_SECRET, {
        expiresIn: '7d',
      });
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockAdminUser);

      const res = await request(app).post('/api/v1/auth/refresh').send({
        refreshToken: validRefreshToken,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    it('should return 400 on empty body', async () => {
      const res = await request(app).post('/api/v1/auth/refresh').send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 on invalid refresh token', async () => {
      const res = await request(app).post('/api/v1/auth/refresh').send({
        refreshToken: 'invalid.refresh.token',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // --- GET /api/v1/auth/me ---
  describe('GET /api/v1/auth/me', () => {
    it('should return 200 with user profile on valid token', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockAdminUser);

      const token = jwt.sign(
        { userId: mockAdminUser.userId, email: mockAdminUser.email, role: mockAdminUser.role },
        env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      const res = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe('admin@haoxing.id');
      expect(res.body.data.role).toBe('admin');
    });

    it('should return 401 without Authorization header', async () => {
      const res = await request(app).get('/api/v1/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 with invalid token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid.token.here');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // --- PATCH /api/v1/auth/change-password ---
  describe('PATCH /api/v1/auth/change-password', () => {
    it('should return 200 on successful password change', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockAdminUser);
      vi.mocked(prisma.user.update).mockResolvedValue(mockAdminUser);

      const token = jwt.sign(
        { userId: mockAdminUser.userId, email: mockAdminUser.email, role: mockAdminUser.role },
        env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      const res = await request(app)
        .patch('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'haoxing2026',
          newPassword: 'newSecurePass123',
          confirmNewPassword: 'newSecurePass123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Password berhasil diperbarui');
    });

    it('should return 400 when passwords do not match', async () => {
      const token = jwt.sign(
        { userId: mockAdminUser.userId, email: mockAdminUser.email, role: mockAdminUser.role },
        env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      const res = await request(app)
        .patch('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'haoxing2026',
          newPassword: 'newPassword123',
          confirmNewPassword: 'differentPassword',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 401 without token', async () => {
      const res = await request(app).patch('/api/v1/auth/change-password').send({
        currentPassword: 'haoxing2026',
        newPassword: 'newPassword123',
        confirmNewPassword: 'newPassword123',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // --- POST /api/v1/auth/logout ---
  describe('POST /api/v1/auth/logout', () => {
    it('should return 200 on logout', async () => {
      const res = await request(app).post('/api/v1/auth/logout');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe(
        'Logout berhasil. Silakan hapus token dari penyimpanan client.'
      );
    });
  });
});
