import 'reflect-metadata';
import express, { Express } from 'express';
import cors from 'cors';
import { json } from 'body-parser';
import path from 'path';
import { registerRoutes } from './routes';

export const createApp = (): Express => {
  const app = express();
  app.use(cors());
  app.use(json());

  // Public klasörünü static olarak serve et (uploads için)
  const publicDir = __dirname.includes('dist')
    ? path.join(__dirname, 'public')
    : path.join(__dirname, '../public');
  app.use('/uploads', express.static(path.join(publicDir, 'uploads')));

  registerRoutes(app);

  return app;
};
