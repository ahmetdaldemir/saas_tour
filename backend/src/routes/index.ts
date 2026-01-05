import { Express } from 'express';
import tenantRouter from '../modules/tenants/routes/tenant.router';
import tourRouter from '../modules/tour/routes/tour.router';
import tourFeatureRouter from '../modules/tour/routes/tour-feature.router';
import rentacarRouter from '../modules/rentacar/routes/rentacar.router';
import vehicleCategoryRouter from '../modules/rentacar/routes/vehicle-category.router';
import vehicleBrandRouter from '../modules/rentacar/routes/vehicle-brand.router';
import vehicleModelRouter from '../modules/rentacar/routes/vehicle-model.router';
import locationRouter from '../modules/rentacar/routes/location.router';
import locationPricingRouter from '../modules/rentacar/routes/location-pricing.router';
import locationDeliveryPricingRouter from '../modules/rentacar/routes/location-delivery-pricing.router';
import extraRouter from '../modules/rentacar/routes/extra.router';
import authRouter from '../modules/auth/routes/auth.router';
import languageRouter from '../modules/shared/routes/language.router';
import destinationRouter from '../modules/shared/routes/destination.router';
import hotelRouter from '../modules/shared/routes/hotel.router';
import blogRouter from '../modules/shared/routes/blog.router';
import pageRouter from '../modules/shared/routes/page.router';
import translationRouter from '../modules/shared/routes/translation.router';
import currencyRouter from '../modules/shared/routes/currency.router';
import masterLocationRouter from '../modules/shared/routes/master-location.router';
import tenantSettingsRouter from '../modules/shared/routes/tenant-settings.router';
import customerRouter from '../modules/shared/routes/customer.router';
import surveyRouter from '../modules/shared/routes/survey.router';
import reservationRouter from '../modules/shared/routes/reservation.router';
import reservationLogRouter from '../modules/shared/routes/reservation-log.router';
import monitoringRouter from '../modules/admin/routes/monitoring.router';
import tenantMonitoringRouter from '../modules/admin/routes/tenant-monitoring.router';
import emailTemplateRouter from '../modules/shared/routes/email-template.router';
import mailRouter from '../modules/shared/routes/mail.router';
import countryRouter from '../modules/shared/routes/country.router';
import financeRouter from '../modules/finance/routes/finance.router';
import tenantUserRouter from '../modules/tenants/routes/tenant-user.router';
import { transferVehicleRouter } from '../modules/transfer/routes/transfer-vehicle.router';
import { transferRouteRouter } from '../modules/transfer/routes/transfer-route.router';
import { transferPricingRouter } from '../modules/transfer/routes/transfer-pricing.router';
import { transferReservationRouter } from '../modules/transfer/routes/transfer-reservation.router';
import { transferDriverRouter } from '../modules/transfer/routes/transfer-driver.router';
import docsRouter from './docs.router';
import chatRouter from '../modules/chat/routes/chat.router';
import chatWidgetRouter from '../modules/chat/routes/chat-widget.router';
import opsTaskRouter from '../modules/ops/routes/ops-task.router';
import staffPerformanceRouter from '../modules/ops/routes/staff-performance.router';
import crmPageCategoryRouter from '../modules/crm/routes/crm-page-category.router';
import crmPageRouter from '../modules/crm/routes/crm-page.router';
import adminAuthRouter from '../modules/admin/routes/admin-auth.router';

export const registerRoutes = (app: Express) => {
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // API Documentation
  app.use('/api', docsRouter);

  // Public widget routes (no auth required, validated via publicKey)
  app.use('/api/chat/widget', chatWidgetRouter);

  app.use('/api/auth', authRouter);
  app.use('/api/languages', languageRouter);
  app.use('/api/destinations', destinationRouter);
  app.use('/api/hotels', hotelRouter);
  app.use('/api/blogs', blogRouter);
  app.use('/api/pages', pageRouter);
  app.use('/api/tenants', tenantRouter);
  app.use('/api/tenant-users', tenantUserRouter);
  app.use('/api/tours', tourRouter);
  app.use('/api/tour-features', tourFeatureRouter);
  // Register more specific routes FIRST to avoid route matching conflicts
  app.use('/api/rentacar/locations', locationRouter);
  app.use('/api/rentacar/location-pricing', locationPricingRouter);
  app.use('/api/rentacar/location-delivery-pricing', locationDeliveryPricingRouter);
  app.use('/api/rentacar/vehicle-categories', vehicleCategoryRouter);
  app.use('/api/rentacar/vehicle-brands', vehicleBrandRouter);
  app.use('/api/rentacar/vehicle-models', vehicleModelRouter);
  app.use('/api/rentacar/extras', extraRouter);
  // Register general rentacar routes AFTER specific routes
  app.use('/api/rentacar', rentacarRouter);
  // Also register at root level for convenience
  app.use('/api/vehicle-categories', vehicleCategoryRouter);
  app.use('/api/vehicle-brands', vehicleBrandRouter);
  app.use('/api/vehicle-models', vehicleModelRouter);
  app.use('/api/translation', translationRouter);
  app.use('/api/currencies', currencyRouter);
  app.use('/api/countries', countryRouter);
  app.use('/api/finance', financeRouter);
  app.use('/api/master-locations', masterLocationRouter);
  app.use('/api/settings', tenantSettingsRouter);
  app.use('/api/crm/customers', customerRouter);
  app.use('/api/crm/page-categories', crmPageCategoryRouter);
  app.use('/api/crm/pages', crmPageRouter);
  app.use('/api/surveys', surveyRouter);
  app.use('/api/reservations', reservationRouter);
  app.use('/api/reservation-logs', reservationLogRouter);
  app.use('/api/email-templates', emailTemplateRouter);
  app.use('/api/mail', mailRouter);
  app.use('/api/transfer/vehicles', transferVehicleRouter);
  app.use('/api/transfer/routes', transferRouteRouter);
  app.use('/api/transfer/pricings', transferPricingRouter);
  app.use('/api/transfer/reservations', transferReservationRouter);
  app.use('/api/transfer/drivers', transferDriverRouter);
  app.use('/api/chat', chatRouter);
  app.use('/api/ops/tasks', opsTaskRouter);
  app.use('/api/ops/performance', staffPerformanceRouter);
  app.use('/api/admin/monitoring', monitoringRouter);
  app.use('/api/admin', tenantMonitoringRouter);
  app.use('/api/admin/auth', adminAuthRouter);
};
