import { Router } from 'express';
import { DestinationController } from '../controllers/destination.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';

const router = Router();

// Public endpoints - no authentication required
router.get('/', DestinationController.list);
router.get('/:id', DestinationController.getById);

// Protected endpoints - authentication required
router.use(authenticate);
router.post('/', DestinationController.create);
router.patch('/:id', DestinationController.update);
router.delete('/:id', DestinationController.remove);
router.post('/import', DestinationController.importFromApi);
router.post('/generate-content', DestinationController.generateContent);

export default router;
