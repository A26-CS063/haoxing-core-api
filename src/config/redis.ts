import { Redis } from 'ioredis';
import { env } from './env.js';

let redisClient: Redis | null = null;
let isRedisConnected = false;

if (env.REDIS_URL) {
  try {
    redisClient = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 2,
      retryStrategy(times) {
        if (times > 3) {
          return null; // stop retry
        }
        return 1000;
      },
      lazyConnect: true,
    });

    redisClient
      .connect()
      .then(() => {
        isRedisConnected = true;
        console.log('[INFO] Upstash Redis connected successfully');
      })
      .catch((err) => {
        isRedisConnected = false;
        console.log(
          '[WARN] Redis connection failed, running in memory-fallback mode:',
          err.message
        );
      });

    redisClient.on('error', () => {
      isRedisConnected = false;
    });
  } catch {
    isRedisConnected = false;
    console.log('[WARN] Failed to initialize Redis client, continuing without Redis');
  }
} else {
  console.log('[WARN] REDIS_URL not provided, running in memory-fallback mode');
}

export class CacheService {
  static async get<T>(key: string): Promise<T | null> {
    if (!isRedisConnected || !redisClient) return null;
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  static async set(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
    if (!isRedisConnected || !redisClient) return;
    try {
      await redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch {
      // Ignore cache write error
    }
  }

  static async del(key: string): Promise<void> {
    if (!isRedisConnected || !redisClient) return;
    try {
      await redisClient.del(key);
    } catch {
      // Ignore cache delete error
    }
  }
}

export { redisClient, isRedisConnected };
