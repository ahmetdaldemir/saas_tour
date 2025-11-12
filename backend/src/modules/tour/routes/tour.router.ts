import { Router } from 'express';
import { TourController } from '../controllers/tour.controller';

const router = Router();

router.get('/', TourController.list);
router.get('/:id', TourController.getById);
router.post('/', TourController.create);
router.put('/:id', TourController.update);
router.patch('/:id', TourController.update);
router.delete('/:id', TourController.remove);

export default router;
