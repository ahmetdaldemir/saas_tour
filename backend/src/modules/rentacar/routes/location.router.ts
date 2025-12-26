import { Router } from 'express';
import { LocationController } from '../controllers/location.controller';
import { AuthenticatedRequest } from '../../auth/middleware/auth.middleware';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { authorize } from '../../auth/middleware/authorize.middleware';
import { Permission } from '../../auth/permissions';

const router = Router();

// Public endpoints - no authentication required
// GET /api/rentacar/locations - List locations (tenantId from query parameter)
router.get('/', (req, res, next) => LocationController.list(req, res).catch(next));

// Protected endpoints - authentication and authorization required
router.use(authenticate);

// GET /api/rentacar/locations/:id - Get location by ID (authenticated)
router.get('/:id', (req, res, next) => LocationController.getById(req as AuthenticatedRequest, res).catch(next));

// POST /api/rentacar/locations - Create location (authenticated + authorized)
router.post('/', authorize(Permission.LOCATION_CREATE), LocationController.create);

// PUT/PATCH /api/rentacar/locations/:id - Update location (authenticated + authorized)
router.put('/:id', authorize(Permission.LOCATION_UPDATE), (req, res, next) => LocationController.update(req as AuthenticatedRequest, res).catch(next));
router.patch('/:id', authorize(Permission.LOCATION_UPDATE), (req, res, next) => LocationController.update(req as AuthenticatedRequest, res).catch(next));

// DELETE /api/rentacar/locations/:id - Delete location (authenticated + authorized)
router.delete('/:id', authorize(Permission.LOCATION_DELETE), (req, res, next) => LocationController.remove(req as AuthenticatedRequest, res).catch(next));

export default router;

