import { Router } from 'express';
import { TourFeatureController } from '../controllers/tour-feature.controller';

const router = Router();

router.get('/', TourFeatureController.list);
router.get('/:id', TourFeatureController.getById);
router.post('/', TourFeatureController.create);
router.put('/:id', TourFeatureController.update);
router.patch('/:id', TourFeatureController.update);
router.delete('/:id', TourFeatureController.remove);

export default router;

