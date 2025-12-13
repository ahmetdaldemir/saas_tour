import { Router } from 'express';
import { ReservationController } from '../controllers/reservation.controller';

const router = Router();

router.get('/', ReservationController.list);
router.get('/:id', ReservationController.getById);
router.put('/:id/status', ReservationController.updateStatus);
router.put('/:id', ReservationController.update);

export default router;

