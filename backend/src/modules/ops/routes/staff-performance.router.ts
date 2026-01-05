import { Router } from 'express';
import { StaffPerformanceController } from '../controllers/staff-performance.controller';
import { AuthenticatedRequest } from '../../auth/middleware/auth.middleware';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { TenantRequest } from '../../../middleware/tenant.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get my scores
router.get('/my-scores', (req, res, next) =>
  StaffPerformanceController.getMyScores(req as AuthenticatedRequest & TenantRequest, res).catch(next)
);

// Get tenant scores (admin)
router.get('/tenant-scores', (req, res, next) =>
  StaffPerformanceController.getTenantScores(req as AuthenticatedRequest & TenantRequest, res).catch(next)
);

// Get user score details
router.get('/user/:userId/score', (req, res, next) =>
  StaffPerformanceController.getUserScoreDetails(req as AuthenticatedRequest & TenantRequest, res).catch(next)
);

// Recalculate scores
router.post('/recalculate', (req, res, next) =>
  StaffPerformanceController.recalculateScores(req as AuthenticatedRequest & TenantRequest, res).catch(next)
);

export default router;

