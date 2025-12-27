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

  // Public klasörünü static olarak serve et (uploads için)
  let publicDir: string;
  if (__dirname.includes('dist')) {
    // Production: dist/app.js -> public (Dockerfile'da kopyalanır)
    publicDir = path.join(__dirname, '../public');
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
  
  // Serve uploads directory as static files (BEFORE tenantMiddleware - public access)
  app.use('/uploads', express.static(uploadsDir, {
    index: false, // Don't serve directory listings
    fallthrough: false, // Don't fall through to next middleware if file not found
    dotfiles: 'ignore', // Ignore dotfiles
  }));
  logger.info(`Serving static files from: ${uploadsDir}`);

  // Serve widget.js from public directory (BEFORE tenantMiddleware - no tenant required)
  app.get('/widget.js', (req, res) => {
    const widgetPath = path.join(publicDir, 'widget.js');
    if (fs.existsSync(widgetPath)) {
      res.type('application/javascript');
      res.sendFile(widgetPath);
    } else {
      logger.error(`Widget file not found at: ${widgetPath}`);
      res.status(404).json({ error: 'Widget file not found' });
    }
  });

  // Tenant resolution middleware (extracts tenant from Host header)
  // Must be AFTER public routes like /widget.js
  app.use(tenantMiddleware);

  // Register all routes
  registerRoutes(app);

  // 404 handler (must be after all routes)
  app.use(notFoundHandler);

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
};
