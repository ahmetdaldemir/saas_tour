import 'reflect-metadata';
import express, { Express } from 'express';
import cors from 'cors';
import { json } from 'body-parser';
import { registerRoutes } from './routes';

export const createApp = (): Express => {
  const app = express();
  app.use(cors());
  app.use(json());

  registerRoutes(app);

  return app;
};
