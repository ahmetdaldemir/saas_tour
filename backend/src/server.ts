import { createServer } from 'http';
import { createApp } from './app';
import { AppDataSource } from './config/data-source';
import { loadEnv } from './config/env';
import { startCurrencyScheduler } from './services/currency-scheduler.service';
import { startFinanceReminderScheduler } from './services/finance-reminder-scheduler.service';
import { ChatSocketServer } from './modules/chat/websocket/chat-socket.server';
import { logger } from './utils/logger';
import { getRedisClient } from './config/redis.config';
// Initialize vehicle tracking providers
import './modules/rentacar/services/vehicle-tracking.service';

const start = async () => {
  const config = loadEnv();

  // Initialize database connection
  await AppDataSource.initialize();
  logger.info('Database connection initialized');

  // Initialize Redis connection
  try {
    const redis = getRedisClient();
    await redis.connect();
    // Test connection with a simple command
    await redis.ping();
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

  // Create HTTP server with Express app
  const httpServer = createServer(app);

  // Initialize WebSocket server for chat (must be after httpServer creation)
  // Socket.io attaches its own request handler to the HTTP server
  // IMPORTANT: Socket.io's handler runs BEFORE Express app's handler
  // So Socket.io requests are handled by Socket.io, not Express
  new ChatSocketServer(httpServer);
  
  logger.info('HTTP server and Socket.io initialized');

  // Currency scheduler'ı başlat (production'da)
  if (config.nodeEnv === 'production') {
    startCurrencyScheduler();
    startFinanceReminderScheduler();
  }

  httpServer.listen(port, () => {
    logger.info(`API running on port ${port}`, { environment: config.nodeEnv });
  });
};

start().catch((error) => {
  console.error('❌ Failed to start API', error);
  process.exit(1);
});
