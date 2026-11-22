import { describe, it, expect, vi } from 'vitest';
import express from 'express';
import request from 'supertest';

// Mock Redis to enforce in-memory rate limiting store during testing
vi.mock('../../config/redis.js', () => ({
  redisClient: null,
  isRedisConnected: false,
}));

import { generalLimiter, authLimiter } from '../rateLimit.middleware.js';

describe('Rate Limit Middleware', () => {
  it('should allow requests within limit in generalLimiter', async () => {
    const app = express();
    app.use(generalLimiter);
    app.get('/test', (_req, res) => {
      res.status(200).json({ success: true });
    });

    const res = await request(app).get('/test');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.headers['ratelimit-limit']).toBeDefined();
  });

  it('should block requests exceeding max limit in authLimiter', async () => {
    const app = express();
    app.use(authLimiter);
    app.post('/api/v1/auth/login', (_req, res) => {
      res.status(200).json({ success: true });
    });

    // Send 5 successful requests
    for (let i = 0; i < 5; i++) {
      const res = await request(app).post('/api/v1/auth/login');
      expect(res.status).toBe(200);
    }

    // 6th request should hit HTTP 429 Too Many Requests
    const res = await request(app).post('/api/v1/auth/login');
    expect(res.status).toBe(429);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe(
      'Terlalu banyak percobaan login yang gagal. Silakan coba lagi setelah 15 menit.'
    );
  });
});
