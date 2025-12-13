import { Router } from 'express';
import { TransferRouteController } from '../controllers/transfer-route.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', TransferRouteController.list);
router.get('/:id', TransferRouteController.getById);
router.post('/', TransferRouteController.create);
router.put('/:id', TransferRouteController.update);
router.delete('/:id', TransferRouteController.delete);

export { router as transferRouteRouter };

