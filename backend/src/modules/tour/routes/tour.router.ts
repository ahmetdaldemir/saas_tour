import { Router } from 'express';
import { TourController } from '../controllers/tour.controller';

const router = Router();

router.get('/', TourController.list);
router.post('/', TourController.create);

export default router;
