import { Router } from 'express';
import { VehicleModelController } from '../controllers/vehicle-model.controller';

const router = Router();

router.get('/', VehicleModelController.list);
router.post('/', VehicleModelController.create);
router.get('/:id', VehicleModelController.getById);
router.put('/:id', VehicleModelController.update);
router.patch('/:id', VehicleModelController.update);
router.delete('/:id', VehicleModelController.remove);

export default router;

