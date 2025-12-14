import { Router } from 'express';
import { TenantMonitoringController } from '../controllers/tenant-monitoring.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';

const router = Router();

// Tüm route'lar authentication gerektirir
router.get('/tenants', authenticate, TenantMonitoringController.listTenants);
router.get('/tenants/:id', authenticate, TenantMonitoringController.getTenantDetails);
router.get('/tenants/:id/activity', authenticate, TenantMonitoringController.getTenantActivity);

export default router;

