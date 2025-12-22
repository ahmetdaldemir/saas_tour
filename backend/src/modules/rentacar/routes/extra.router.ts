import { Router } from 'express';
import { ExtraController } from '../controllers/extra.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { authorize } from '../../auth/middleware/authorize.middleware';
import { Permission } from '../../auth/permissions';

const router = Router();

router.use(authenticate);
router.get('/', authorize(Permission.EXTRA_VIEW), ExtraController.list);
router.get('/:id', authorize(Permission.EXTRA_VIEW), ExtraController.getById);
router.post('/', authorize(Permission.EXTRA_CREATE), ExtraController.create);
router.put('/:id', authorize(Permission.EXTRA_UPDATE), ExtraController.update);
router.delete('/:id', authorize(Permission.EXTRA_DELETE), ExtraController.remove);

export default router;

