import { Router } from 'express';
import { LocationController } from '../controllers/location.controller';

const router = Router();

router.get('/', LocationController.list);
router.post('/', LocationController.create);
router.get('/:id', LocationController.getById);
router.put('/:id', LocationController.update);
router.patch('/:id', LocationController.update);
router.delete('/:id', LocationController.remove);

export default router;

