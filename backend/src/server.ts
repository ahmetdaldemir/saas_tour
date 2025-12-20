import { createServer } from 'http';
import { createApp } from './app';
import { AppDataSource } from './config/data-source';
import { loadEnv } from './config/env';
import { startCurrencyScheduler } from './services/currency-scheduler.service';
import { ChatSocketServer } from './modules/chat/websocket/chat-socket.server';
import { logger } from './utils/logger';
import { getRedisClient } from './config/redis.config';

const start = async () => {
  const config = loadEnv();

  // Initialize database connection
  await AppDataSource.initialize();
  logger.info('Database connection initialized');

  // Initialize Redis connection
  try {
    const redis = getRedisClient();
    await redis.connect();
    logger.info('Redis connection initialized');
  } catch (error) {
    logger.warn('Redis connection failed, continuing without cache', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    // Continue without Redis - cache operations will gracefully fail
  }

  // Migrations disabled - using TypeORM synchronize instead
  // All schema changes are handled via entity synchronize (DB_SYNC=true)
  // if (config.nodeEnv === 'production' && !AppDataSource.options.synchronize) {
  //   // Migration code removed - using synchronize instead
  // }

  const app = createApp();
  const port = config.app.port;

  // Create HTTP server for WebSocket support
  const httpServer = createServer(app);

  // Initialize WebSocket server for chat
  new ChatSocketServer(httpServer);

  // Currency scheduler'ı başlat (production'da)
  if (config.nodeEnv === 'production') {
    startCurrencyScheduler();
  }

  httpServer.listen(port, () => {
    logger.info(`API running on port ${port}`, { environment: config.nodeEnv });
  });
};

start().catch((error) => {
  console.error('❌ Failed to start API', error);
  process.exit(1);
});
