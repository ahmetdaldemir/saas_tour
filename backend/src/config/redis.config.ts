import Redis from 'ioredis';
import { loadEnv } from './env';

let redisClient: Redis | null = null;

export const getRedisClient = (): Redis => {
  if (redisClient) {
    return redisClient;
  }

  const config = loadEnv();
  const redisHost = process.env.REDIS_HOST || 'localhost';
  const redisPort = Number(process.env.REDIS_PORT || 6379);
  const redisPassword = process.env.REDIS_PASSWORD || undefined;

  redisClient = new Redis({
    host: redisHost,
    port: redisPort,
    password: redisPassword,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: true, // Connect manually in server.ts
  });

  redisClient.on('error', (error) => {
    console.error('❌ Redis connection error:', error);
  });

  redisClient.on('connect', () => {
    console.log('✅ Redis connected');
  });

  return redisClient;
};

export const closeRedisClient = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
};

