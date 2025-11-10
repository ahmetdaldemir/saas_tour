import { Router } from 'express';
import { HotelController } from '../controllers/hotel.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';

const router = Router();

router.use(authenticate);
router.get('/', HotelController.list);
router.post('/', HotelController.create);
router.patch('/:id', HotelController.update);
router.delete('/:id', HotelController.remove);

export default router;
