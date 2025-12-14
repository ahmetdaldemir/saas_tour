import { Router } from 'express';
import { ExtraController } from '../controllers/extra.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, ExtraController.list);
router.get('/:id', authenticate, ExtraController.getById);
router.post('/', authenticate, ExtraController.create);
router.put('/:id', authenticate, ExtraController.update);
router.delete('/:id', authenticate, ExtraController.remove);

export default router;

