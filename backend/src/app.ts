import 'reflect-metadata';
import express, { Express } from 'express';
import cors from 'cors';
import { json } from 'body-parser';
import path from 'path';
import fs from 'fs';
import { registerRoutes } from './routes';
import { requestLogger } from './middleware/request-logger.middleware';
import { tenantMiddleware } from './middleware/tenant.middleware';
import { errorHandler, notFoundHandler } from './middleware/error-handler.middleware';
import { logger } from './utils/logger';

export const createApp = (): Express => {
  // Note: For WebSocket support, use createHttpServer() in server.ts
  const app = express();
  app.use(cors());
  app.use(json());

  // Request logging middleware (should be early in the chain)
  app.use(requestLogger);

  // Tenant resolution middleware (extracts tenant from Host header)
  app.use(tenantMiddleware);

  // Public klasörünü static olarak serve et (uploads için)
  let publicDir: string;
  if (__dirname.includes('dist')) {
    // Production: dist/app.js -> dist/public
    publicDir = path.join(__dirname, 'public');
  } else {
    // Development: src/app.ts -> public
    publicDir = path.join(__dirname, '../public');
  }
  
  const uploadsDir = path.join(publicDir, 'uploads');
  
  // Uploads klasörünü oluştur
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    logger.info(`Created uploads directory: ${uploadsDir}`);
  }
  
  app.use('/uploads', express.static(uploadsDir));
  logger.info(`Serving static files from: ${uploadsDir}`);

  // Serve widget.js from public directory
  app.get('/widget.js', (req, res) => {
    const widgetPath = path.join(publicDir, 'widget.js');
    if (fs.existsSync(widgetPath)) {
      res.type('application/javascript');
      res.sendFile(widgetPath);
    } else {
      res.status(404).json({ error: 'Widget file not found' });
    }
  });

  // Register all routes
  registerRoutes(app);

  // 404 handler (must be after all routes)
  app.use(notFoundHandler);

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
};
