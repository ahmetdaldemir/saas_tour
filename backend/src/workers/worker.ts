import { AppDataSource } from '../config/data-source';
import { EmailWorker } from './email.worker';

/**
 * Worker process entry point
 * Bu dosya ayrı bir process olarak çalıştırılır
 */
async function startWorker() {
  console.log('🚀 Starting worker process...');

  try {
    // Database bağlantısını başlat
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    // Email worker'ı başlat
    await EmailWorker.start();

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('SIGTERM received, shutting down gracefully...');
      await AppDataSource.destroy();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('SIGINT received, shutting down gracefully...');
      await AppDataSource.destroy();
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Failed to start worker:', error);
    process.exit(1);
  }
}

// Worker'ı başlat
startWorker();

