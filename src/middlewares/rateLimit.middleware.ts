import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redisClient } from '../config/redis.js';

const getStore = (prefix: string) => {
  if (redisClient) {
    return new RedisStore({
      // @ts-expect-error ioredis sendCommand compatibility
      sendCommand: (...args: string[]) => redisClient.call(...args),
      prefix,
    });
  }
  return undefined; // default in-memory
};

// 1. General Rate Limiter: Maksimal 100 request per 15 menit per IP
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore('rl:general:'),
  message: {
    success: false,
    message: 'Terlalu banyak permintaan dari IP ini. Silakan coba lagi setelah 15 menit.',
  },
});

// 2. Auth Limiter: Maksimal 5 percobaan login per 15 menit per IP
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore('rl:auth:'),
  message: {
    success: false,
    message: 'Terlalu banyak percobaan login yang gagal. Silakan coba lagi setelah 15 menit.',
  },
});
