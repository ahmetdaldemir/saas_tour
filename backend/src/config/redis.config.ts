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
  const redisPassword = process.env.REDIS_PASSWORD?.trim() || undefined;

  // Only include password if it's provided and not empty
  const redisConfig: any = {
    host: redisHost,
    port: redisPort,
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: true, // Connect manually in server.ts
  };

  // Only add password if it's provided
  if (redisPassword && redisPassword.length > 0) {
    redisConfig.password = redisPassword;
  }

  redisClient = new Redis(redisConfig);

  redisClient.on('error', (error) => {
    // Only log if it's not a connection error (to avoid spam)
    if (!error.message?.includes('NOAUTH') && !error.message?.includes('ECONNREFUSED')) {
      console.error('❌ Redis connection error:', error);
    }
  });

  redisClient.on('connect', () => {
    console.log('✅ Redis connected');
  });

  redisClient.on('ready', () => {
    console.log('✅ Redis ready');
  });

  redisClient.on('close', () => {
    console.log('⚠️  Redis connection closed');
  });

  return redisClient;
};

export const closeRedisClient = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
};

