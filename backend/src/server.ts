import { createApp } from './app';
import { AppDataSource } from './config/data-source';
import { loadEnv } from './config/env';
import { startCurrencyScheduler } from './services/currency-scheduler.service';

const start = async () => {
  const config = loadEnv();

  // Initialize database connection
  await AppDataSource.initialize();
  console.log('✅ Database connection initialized');

  // Run pending migrations in production (if synchronize is disabled)
  if (config.nodeEnv === 'production' && !AppDataSource.options.synchronize) {
    try {
      console.log('🔄 Checking for pending migrations...');
      const migrations = await AppDataSource.runMigrations();
      if (migrations && migrations.length > 0) {
        console.log(`✅ ${migrations.length} migration(s) completed successfully`);
        migrations.forEach((migration) => {
          console.log(`   - ${migration.name}`);
        });
      } else {
        console.log('ℹ️  No pending migrations');
      }
    } catch (error: any) {
      console.error('❌ Migration error:', error.message || error);
      // Don't exit in production, allow server to start
      // but log the error for investigation
      console.warn('⚠️  Server will continue despite migration errors');
      console.warn('⚠️  Tip: If tables are missing, set DB_SYNC=true in .env to auto-create schema');
    }
  }

  const app = createApp();
  const port = config.app.port;

  // Currency scheduler'ı başlat (production'da)
  if (config.nodeEnv === 'production') {
    startCurrencyScheduler();
  }

  app.listen(port, () => {
    console.log(`🚀 API running on port ${port}`);
    console.log(`📊 Environment: ${config.nodeEnv}`);
  });
};

start().catch((error) => {
  console.error('❌ Failed to start API', error);
  process.exit(1);
});
