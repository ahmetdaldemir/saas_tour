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
  
  // CORS configuration - allow all saastour360.com subdomains and tenant custom domains
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server requests)
      if (!origin) {
        logger.info('[CORS] No origin header, allowing request');
        return callback(null, true);
      }
      
      logger.info(`[CORS] Checking origin: ${origin}`);
      
      // Extract hostname from origin
      let hostname: string;
      try {
        const url = new URL(origin);
        hostname = url.hostname;
      } catch (e) {
        logger.warn(`[CORS] Invalid origin format: ${origin}`);
        return callback(new Error(`Invalid origin format: ${origin}`));
      }
      
      // Allow all saastour360.com subdomains and local development
      const allowedPatterns = [
        /^https?:\/\/[a-z0-9-]+\.saastour360\.com$/i,
        /^https?:\/\/[a-z0-9-]+\.local\.saastour360\.test$/i,
        /^https?:\/\/(www\.)?bergrentacar\.com$/i, // Tenant custom domain
        /^https?:\/\/(www\.)?sunsetcarrent\.com$/i, // Tenant custom domain
        'https://api.saastour360.com',
        'http://api.saastour360.com',
        'http://localhost:5001',
        'http://localhost:4001',
        'http://localhost:3000',
      ];
      
      // Check against patterns
      const matchesPattern = allowedPatterns.some(pattern => {
        if (typeof pattern === 'string') {
          try {
            const patternUrl = new URL(pattern);
            const matches = hostname === patternUrl.hostname || origin.toLowerCase() === pattern.toLowerCase();
            if (matches) logger.info(`[CORS] ✅ Matched string origin: ${pattern}`);
            return matches;
          } catch {
            const matches = origin.toLowerCase() === pattern.toLowerCase();
            if (matches) logger.info(`[CORS] ✅ Matched string origin: ${pattern}`);
            return matches;
          }
        }
        const matches = pattern.test(origin);
        if (matches) logger.info(`[CORS] ✅ Matched regex pattern for origin: ${origin}`);
        return matches;
      });
      
      if (matchesPattern) {
        logger.info(`[CORS] ✅ Origin ALLOWED: ${origin}`);
        return callback(null, true);
      }
      
      // If pattern doesn't match, check if it's a known tenant custom domain
      // For now, we'll allow known tenant domains (can be expanded to check database)
      const knownTenantDomains = [
        'www.bergrentacar.com',
        'bergrentacar.com',
      ];
      
      const isKnownTenantDomain = knownTenantDomains.some(domain => {
        const matches = hostname === domain || hostname === `www.${domain}` || hostname.replace(/^www\./, '') === domain;
        if (matches) logger.info(`[CORS] ✅ Matched known tenant domain: ${domain}`);
        return matches;
      });
      
      if (isKnownTenantDomain) {
        logger.info(`[CORS] ✅ Origin ALLOWED (tenant domain): ${origin}`);
        return callback(null, true);
      }
      
      logger.warn(`[CORS] ❌ Origin NOT ALLOWED: ${origin} (hostname: ${hostname})`);
      logger.warn(`[CORS] Allowed patterns: ${allowedPatterns.map(p => typeof p === 'string' ? p : p.toString()).join(', ')}`);
      callback(new Error(`Not allowed by CORS: ${origin}`));
    },
      
      const isAllowed = allowedOrigins.some(allowed => {
        if (typeof allowed === 'string') {
          const matches = origin.toLowerCase() === allowed.toLowerCase();
          if (matches) logger.info(`[CORS] ✅ Matched string origin: ${allowed}`);
          return matches;
        }
        const matches = allowed.test(origin);
        if (matches) logger.info(`[CORS] ✅ Matched regex pattern for origin: ${origin}`);
        return matches;
      });
      
      if (isAllowed) {
        logger.info(`[CORS] ✅ Origin ALLOWED: ${origin}`);
        callback(null, true);
      } else {
        logger.warn(`[CORS] ❌ Origin NOT ALLOWED: ${origin}`);
        // Log all allowed patterns for debugging
        logger.warn(`[CORS] Allowed patterns: ${allowedOrigins.map(o => typeof o === 'string' ? o : o.toString()).join(', ')}`);
        callback(new Error(`Not allowed by CORS: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['Content-Length', 'Content-Type'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  }));
  
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
