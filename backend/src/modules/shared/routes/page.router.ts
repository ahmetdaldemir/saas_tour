import { Router } from 'express';
import { PageController } from '../controllers/page.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';

const router = Router();

router.use(authenticate);
router.get('/', PageController.list);
router.get('/:id', PageController.getById);
router.post('/', PageController.create);
router.put('/:id', PageController.update);
router.delete('/:id', PageController.remove);

export default router;

