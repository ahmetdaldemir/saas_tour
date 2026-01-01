import { Router } from 'express';
import { OpsTaskController } from '../controllers/ops-task.controller';
import { AuthenticatedRequest } from '../../auth/middleware/auth.middleware';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { TenantRequest } from '../../../middleware/tenant.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', (req, res, next) =>
  OpsTaskController.list(req as AuthenticatedRequest & TenantRequest, res).catch(next)
);

router.get('/:id', (req, res, next) =>
  OpsTaskController.getById(req as AuthenticatedRequest & TenantRequest, res).catch(next)
);

router.post('/', (req, res, next) =>
  OpsTaskController.createOrGet(req as AuthenticatedRequest & TenantRequest, res).catch(next)
);

router.post('/:id/media', (req, res, next) =>
  OpsTaskController.updateMedia(req as AuthenticatedRequest & TenantRequest, res).catch(next)
);

router.post('/:id/verify-docs', (req, res, next) =>
  OpsTaskController.verifyDocs(req as AuthenticatedRequest & TenantRequest, res).catch(next)
);

router.post('/:id/finalize', (req, res, next) =>
  OpsTaskController.finalizeCheckout(req as AuthenticatedRequest & TenantRequest, res).catch(next)
);

router.post('/:id/return/finalize', (req, res, next) =>
  OpsTaskController.finalizeReturn(req as AuthenticatedRequest & TenantRequest, res).catch(next)
);

router.get('/:id/print', (req, res, next) =>
  OpsTaskController.getPrintPayload(req as AuthenticatedRequest & TenantRequest, res).catch(next)
);

export default router;

