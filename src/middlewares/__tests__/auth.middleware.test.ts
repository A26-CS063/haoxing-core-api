import { describe, it, expect, vi } from 'vitest';
import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticateJWT, requireRole } from '../auth.middleware.js';
import { AuthenticatedRequest, UserTokenPayload } from '../../types/auth.types.js';
import { env } from '../../config/env.js';

describe('Auth Middleware', () => {
  const mockResponse = () => {
    const res: Partial<Response> = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res as Response;
  };

  const mockNext = vi.fn() as NextFunction;

  describe('authenticateJWT', () => {
    it('should return 401 if Authorization header is missing', () => {
      const req = {
        headers: {},
      } as AuthenticatedRequest;
      const res = mockResponse();

      authenticateJWT(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Akses ditolak: Token autentikasi tidak ditemukan',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 if token is invalid', () => {
      const req = {
        headers: {
          authorization: 'Bearer invalid.token.payload',
        },
      } as AuthenticatedRequest;
      const res = mockResponse();

      authenticateJWT(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Akses ditolak: Token tidak valid atau sudah kedaluwarsa',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should attach user payload and call next() on valid token', () => {
      const payload: UserTokenPayload = {
        userId: 'user-uuid-123',
        email: 'admin@haoxing.id',
        role: 'admin',
      };
      const validToken = jwt.sign(payload, env.JWT_SECRET);

      const req = {
        headers: {
          authorization: `Bearer ${validToken}`,
        },
      } as AuthenticatedRequest;
      const res = mockResponse();
      const next = vi.fn();

      authenticateJWT(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(req.user).toBeDefined();
      expect(req.user?.userId).toBe('user-uuid-123');
      expect(req.user?.role).toBe('admin');
    });
  });

  describe('requireRole', () => {
    it('should return 401 if req.user is undefined', () => {
      const req = {} as AuthenticatedRequest;
      const res = mockResponse();
      const middleware = requireRole(['admin']);

      middleware(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Akses ditolak: Autentikasi diperlukan',
      });
    });

    it('should return 403 if user role is not allowed', () => {
      const req = {
        user: {
          userId: 'user-uuid-123',
          email: 'pemilik@haoxing.id',
          role: 'pemilik',
        },
      } as AuthenticatedRequest;
      const res = mockResponse();
      const middleware = requireRole(['admin']);

      middleware(req, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Peran Anda tidak memiliki izin untuk fitur ini',
      });
    });

    it('should call next() if user role matches allowed roles', () => {
      const req = {
        user: {
          userId: 'user-uuid-123',
          email: 'admin@haoxing.id',
          role: 'admin',
        },
      } as AuthenticatedRequest;
      const res = mockResponse();
      const next = vi.fn();
      const middleware = requireRole(['admin', 'pemilik']);

      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
    });
  });
});
