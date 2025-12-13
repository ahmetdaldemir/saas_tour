import { Router } from 'express';
import { TransferVehicleController } from '../controllers/transfer-vehicle.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', TransferVehicleController.list);
router.get('/:id', TransferVehicleController.getById);
router.post('/', TransferVehicleController.create);
router.put('/:id', TransferVehicleController.update);
router.delete('/:id', TransferVehicleController.delete);

export { router as transferVehicleRouter };

