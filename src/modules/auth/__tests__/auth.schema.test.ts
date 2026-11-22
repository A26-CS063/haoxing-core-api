import { describe, it, expect } from 'vitest';
import { loginSchema, refreshTokenSchema, changePasswordSchema } from '../auth.schema.js';

describe('Auth Schema Validation', () => {
  describe('loginSchema', () => {
    it('should validate valid email and password', () => {
      const validData = {
        email: 'admin@haoxing.id',
        password: 'password123',
      };

      const result = loginSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('admin@haoxing.id');
      }
    });

    it('should fail on invalid email format', () => {
      const invalidData = {
        email: 'bukan-email',
        password: 'password123',
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Format email tidak valid');
      }
    });

    it('should fail on empty password', () => {
      const invalidData = {
        email: 'admin@haoxing.id',
        password: '',
      };

      const result = loginSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Password wajib diisi');
      }
    });
  });

  describe('refreshTokenSchema', () => {
    it('should validate valid refreshToken string', () => {
      const result = refreshTokenSchema.safeParse({ refreshToken: 'valid-token-string' });
      expect(result.success).toBe(true);
    });

    it('should fail on empty refreshToken', () => {
      const result = refreshTokenSchema.safeParse({ refreshToken: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('changePasswordSchema', () => {
    it('should validate matching passwords with minimum 6 characters', () => {
      const validData = {
        currentPassword: 'currentPassword123',
        newPassword: 'newSecretPassword123',
        confirmNewPassword: 'newSecretPassword123',
      };

      const result = changePasswordSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should fail if newPassword is less than 6 characters', () => {
      const invalidData = {
        currentPassword: 'currentPassword123',
        newPassword: '12345',
        confirmNewPassword: '12345',
      };

      const result = changePasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Password baru minimal 6 karakter');
      }
    });

    it('should fail if newPassword and confirmNewPassword do not match', () => {
      const invalidData = {
        currentPassword: 'currentPassword123',
        newPassword: 'newPassword123',
        confirmNewPassword: 'differentPassword123',
      };

      const result = changePasswordSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Konfirmasi password baru tidak cocok');
      }
    });
  });
});
