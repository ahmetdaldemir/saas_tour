import { Router } from 'express';
import { TransferReservationController } from '../controllers/transfer-reservation.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', TransferReservationController.list);
router.get('/reference/:reference', TransferReservationController.getByReference);
router.get('/:id', TransferReservationController.getById);
router.post('/', TransferReservationController.create);
router.put('/:id', TransferReservationController.update);
router.put('/:id/status', TransferReservationController.updateStatus);
router.delete('/:id', TransferReservationController.delete);

export { router as transferReservationRouter };

