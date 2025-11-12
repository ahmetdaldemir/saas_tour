import { Router } from 'express';
import { VehicleCategoryController } from '../controllers/vehicle-category.controller';

const router = Router();

router.get('/', VehicleCategoryController.list);
router.post('/', VehicleCategoryController.create);
router.get('/:id', VehicleCategoryController.getById);
router.put('/:id', VehicleCategoryController.update);
router.patch('/:id', VehicleCategoryController.update);
router.delete('/:id', VehicleCategoryController.remove);

export default router;

