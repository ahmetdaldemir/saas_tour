import { Router } from 'express';
import { TourController } from '../controllers/tour.controller';
import { AuthenticatedRequest } from '../../auth/middleware/auth.middleware';

const router = Router();

router.get('/', TourController.list);
router.get('/:id', (req, res, next) => TourController.getById(req as AuthenticatedRequest, res).catch(next));
router.post('/', TourController.create);
router.put('/:id', TourController.update);
router.patch('/:id', TourController.update);
router.delete('/:id', TourController.remove);

export default router;
