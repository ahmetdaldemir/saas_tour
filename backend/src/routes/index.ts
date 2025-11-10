import { Express } from 'express';
import tenantRouter from '../modules/tenants/routes/tenant.router';
import tourRouter from '../modules/tour/routes/tour.router';
import rentacarRouter from '../modules/rentacar/routes/rentacar.router';
import authRouter from '../modules/auth/routes/auth.router';
import languageRouter from '../modules/shared/routes/language.router';
import destinationRouter from '../modules/shared/routes/destination.router';
import hotelRouter from '../modules/shared/routes/hotel.router';

export const registerRoutes = (app: Express) => {
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/languages', languageRouter);
  app.use('/api/destinations', destinationRouter);
  app.use('/api/hotels', hotelRouter);
  app.use('/api/tenants', tenantRouter);
  app.use('/api/tours', tourRouter);
  app.use('/api/rentacar', rentacarRouter);
};
