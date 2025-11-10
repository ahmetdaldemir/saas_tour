import { createApp } from './app';
import { AppDataSource } from './config/data-source';
import { loadEnv } from './config/env';

const start = async () => {
  const config = loadEnv();

  await AppDataSource.initialize();

  const app = createApp();
  const port = config.app.port;

  app.listen(port, () => {
    console.log(`API running on port ${port}`);
  });
};

start().catch((error) => {
  console.error('Failed to start API', error);
  process.exit(1);
});
