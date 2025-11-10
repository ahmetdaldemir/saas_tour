import { Router } from 'express';
import { DestinationController } from '../controllers/destination.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';

const router = Router();

router.use(authenticate);
router.get('/', DestinationController.list);
router.post('/', DestinationController.create);
router.patch('/:id', DestinationController.update);
router.delete('/:id', DestinationController.remove);
router.post('/import', DestinationController.importFromApi);

export default router;
