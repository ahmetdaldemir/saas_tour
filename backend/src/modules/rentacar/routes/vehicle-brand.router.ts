import { Router } from 'express';
import { VehicleBrandController } from '../controllers/vehicle-brand.controller';

const router = Router();

router.get('/', VehicleBrandController.list);
router.post('/', VehicleBrandController.create);
router.get('/:id', VehicleBrandController.getById);
router.put('/:id', VehicleBrandController.update);
router.patch('/:id', VehicleBrandController.update);
router.delete('/:id', VehicleBrandController.remove);

export default router;

