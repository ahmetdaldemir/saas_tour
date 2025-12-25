import Redis from 'ioredis';
import { loadEnv } from './env';

let redisClient: Redis | null = null;
let redisAvailable = false;
let connectionErrorLogged = false;

const isConnectionError = (error: any): boolean => {
  const errorMessage = error?.message || '';
  const errorCode = error?.code || '';
  
  return (
    errorCode === 'ECONNREFUSED' ||
    errorMessage.includes('ECONNREFUSED') ||
    errorMessage.includes('NOAUTH') ||
    errorMessage.includes('AggregateError') ||
    errorMessage.includes('MaxRetriesPerRequestError')
  );
};

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
      // Stop retrying after 10 attempts (silent mode)
      if (times > 10) {
        return null;
      }
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: true, // Connect manually in server.ts
    enableOfflineQueue: false, // Don't queue commands when offline
  };

  // Only add password if it's provided
  if (redisPassword && redisPassword.length > 0) {
    redisConfig.password = redisPassword;
  }

  redisClient = new Redis(redisConfig);

  redisClient.on('error', (error) => {
    // Only log connection errors once to avoid spam
    if (isConnectionError(error)) {
      if (!connectionErrorLogged) {
        console.warn('⚠️  Redis not available, continuing without cache');
        connectionErrorLogged = true;
        redisAvailable = false;
      }
      return;
    }
    
    // Log other errors (but only once)
    if (!connectionErrorLogged) {
      console.error('❌ Redis error:', error.message || error);
      connectionErrorLogged = true;
    }
  });

  redisClient.on('connect', () => {
    connectionErrorLogged = false;
    redisAvailable = true;
    console.log('✅ Redis connected');
  });

  redisClient.on('ready', () => {
    redisAvailable = true;
    console.log('✅ Redis ready');
  });

  redisClient.on('close', () => {
    redisAvailable = false;
    // Only log close if we were previously connected
    if (connectionErrorLogged === false) {
      console.warn('⚠️  Redis connection closed');
    }
  });

  return redisClient;
};

export const isRedisAvailable = (): boolean => {
  return redisAvailable && redisClient !== null;
};

export const closeRedisClient = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
};

