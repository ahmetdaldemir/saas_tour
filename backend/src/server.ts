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

  // Create HTTP server WITHOUT Express app first
  // We'll attach Express app after Socket.io to ensure Socket.io handles its paths first
  const httpServer = createServer();

  // Initialize WebSocket server for chat FIRST (before Express)
  // Socket.io attaches its own request handler to the HTTP server
  // IMPORTANT: Socket.io's handler MUST run BEFORE Express app's handler
  const chatSocketServer = new ChatSocketServer(httpServer);
  
  // Now attach Express app - Socket.io will handle /socket.io/ paths before Express sees them
  httpServer.on('request', (req, res) => {
    // If it's a Socket.io request, let Socket.io handle it (should already be handled)
    if (req.url?.startsWith('/socket.io/')) {
      // Socket.io should have already handled this, but if not, don't pass to Express
      logger.warn('[SERVER] Socket.io request reached Express handler (unexpected)', {
        method: req.method,
        url: req.url,
      });
      return;
    }
    // Pass all other requests to Express app
    app(req, res);
  });
  
  logger.info('HTTP server and Socket.io initialized (Socket.io before Express)');

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
