import { Router } from 'express';
import { LocationController } from '../controllers/location.controller';
import { AuthenticatedRequest } from '../../auth/middleware/auth.middleware';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { authorize } from '../../auth/middleware/authorize.middleware';
import { Permission } from '../../auth/permissions';

const router = Router();

// Public endpoint - no authentication required, tenantId from query parameter
router.get('/', (req, res, next) => LocationController.list(req, res).catch(next));
router.get('/:id', (req, res, next) => LocationController.getById(req as AuthenticatedRequest, res).catch(next));

// Protected endpoints - authentication and authorization required
router.use(authenticate);
router.post('/', authorize(Permission.LOCATION_CREATE), LocationController.create);
router.put('/:id', authorize(Permission.LOCATION_UPDATE), (req, res, next) => LocationController.update(req as AuthenticatedRequest, res).catch(next));
router.patch('/:id', authorize(Permission.LOCATION_UPDATE), (req, res, next) => LocationController.update(req as AuthenticatedRequest, res).catch(next));
router.delete('/:id', authorize(Permission.LOCATION_DELETE), (req, res, next) => LocationController.remove(req as AuthenticatedRequest, res).catch(next));

export default router;

