import { Router } from 'express';
import { TourController } from '../controllers/tour.controller';
import { AuthenticatedRequest } from '../../auth/middleware/auth.middleware';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { authorize } from '../../auth/middleware/authorize.middleware';
import { Permission } from '../../auth/permissions';

const router = Router();

// Public endpoints - no authentication required
router.get('/', TourController.list);
router.get('/:id', (req, res, next) => TourController.getById(req as AuthenticatedRequest, res).catch(next));

// Protected endpoints - authentication and authorization required
router.use(authenticate);
router.post('/', authorize(Permission.TOUR_CREATE), TourController.create);
router.put('/:id', authorize(Permission.TOUR_UPDATE), TourController.update);
router.patch('/:id', authorize(Permission.TOUR_UPDATE), TourController.update);
router.delete('/:id', authorize(Permission.TOUR_DELETE), TourController.remove);

export default router;
