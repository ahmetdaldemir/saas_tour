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
  // Production'da: /app/dist/app.js -> /app/public
  // Development'ta: src/app.ts -> public
  let publicDir: string;
  if (__dirname.includes('dist')) {
    // Production: dist/app.js -> ../public (Dockerfile'da public klasörü /app/public'e kopyalanır)
    publicDir = path.join(__dirname, '../public');
    logger.info(`[APP] Production mode - __dirname: ${__dirname}, publicDir: ${publicDir}`);
  } else {
    // Development: src/app.ts -> ../public
    publicDir = path.join(__dirname, '../public');
    logger.info(`[APP] Development mode - __dirname: ${__dirname}, publicDir: ${publicDir}`);
  }
  
  const uploadsDir = path.join(publicDir, 'uploads');
  logger.info(`[APP] Uploads directory: ${uploadsDir}`);
  
  // Uploads klasörünü oluştur
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    logger.info(`Created uploads directory: ${uploadsDir}`);
  }
  
  // Serve uploads directory as static files (BEFORE tenantMiddleware - public access)
  // IMPORTANT: This must be BEFORE tenantMiddleware to avoid authentication checks
  app.use('/uploads', (req, res, next) => {
    // Log upload requests for debugging
    const requestedFile = path.join(uploadsDir, req.path.replace(/^\/uploads\//, ''));
    logger.info(`[UPLOADS] Request for: ${req.path} -> File path: ${requestedFile}`);
    logger.info(`[UPLOADS] Directory exists: ${fs.existsSync(uploadsDir)}, File exists: ${fs.existsSync(requestedFile)}`);
    next();
  });
  
  app.use('/uploads', express.static(uploadsDir, {
    index: false, // Don't serve directory listings
    fallthrough: true, // Allow fall through if file not found
    dotfiles: 'ignore', // Ignore dotfiles
    setHeaders: (res, filePath) => {
      // Set proper headers for images
      const ext = path.extname(filePath).toLowerCase();
      if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico'].includes(ext)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000');
      }
    },
  }));
  
  // Custom handler for /uploads if static file not found
  app.use('/uploads', (req, res, next) => {
    const requestedFile = path.join(uploadsDir, req.path.replace(/^\/uploads\//, ''));
    if (!fs.existsSync(requestedFile)) {
      logger.warn(`[UPLOADS] File not found: ${requestedFile}`);
      logger.warn(`[UPLOADS] Uploads directory: ${uploadsDir}`);
      logger.warn(`[UPLOADS] Directory contents: ${fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir).join(', ') : 'DOES NOT EXIST'}`);
      return res.status(404).json({ 
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `File not found: ${req.path}`,
          details: {
            requestedPath: req.path,
            filePath: requestedFile,
            uploadsDir: uploadsDir,
            directoryExists: fs.existsSync(uploadsDir),
            fileExists: fs.existsSync(requestedFile),
          }
        }
      });
    }
    next();
  });
  
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
