import { Router } from 'express';
import { LocationController } from '../controllers/location.controller';
import { AuthenticatedRequest } from '../../auth/middleware/auth.middleware';

const router = Router();

// Public endpoint - no authentication required, tenantId from query parameter
router.get('/', (req, res, next) => LocationController.list(req, res).catch(next));
router.post('/', LocationController.create);
router.get('/:id', (req, res, next) => LocationController.getById(req as AuthenticatedRequest, res).catch(next));
router.put('/:id', (req, res, next) => LocationController.update(req as AuthenticatedRequest, res).catch(next));
router.patch('/:id', (req, res, next) => LocationController.update(req as AuthenticatedRequest, res).catch(next));
router.delete('/:id', (req, res, next) => LocationController.remove(req as AuthenticatedRequest, res).catch(next));

export default router;

