import { createServer } from 'http';
import { createApp } from './app';
import { AppDataSource } from './config/data-source';
import { loadEnv } from './config/env';
import { startCurrencyScheduler } from './services/currency-scheduler.service';
import { ChatSocketServer } from './modules/chat/websocket/chat-socket.server';
import { logger } from './utils/logger';

const start = async () => {
  const config = loadEnv();

  // Initialize database connection
  await AppDataSource.initialize();
  logger.info('Database connection initialized');

  // Run pending migrations in production (if synchronize is disabled)
  if (config.nodeEnv === 'production' && !AppDataSource.options.synchronize) {
    try {
      logger.info('Checking for pending migrations...');
      const migrations = await AppDataSource.runMigrations();
      if (migrations && migrations.length > 0) {
        logger.info(`${migrations.length} migration(s) completed successfully`, {
          migrations: migrations.map(m => m.name),
        });
      } else {
        logger.info('No pending migrations');
      }
    } catch (error: any) {
      logger.error('Migration error', error);
      logger.warn('Server will continue despite migration errors');
      logger.warn('Tip: If tables are missing, set DB_SYNC=true in .env to auto-create schema');
    }
  }

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
