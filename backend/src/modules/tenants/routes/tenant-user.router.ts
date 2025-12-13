import { Router } from 'express';
import { TenantUserController } from '../controllers/tenant-user.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';

const router = Router();

// Tüm route'lar authentication gerektirir
router.use(authenticate);

router.get('/', TenantUserController.list);
router.get('/:id', TenantUserController.getById);
router.post('/', TenantUserController.create);
router.put('/:id', TenantUserController.update);
router.delete('/:id', TenantUserController.delete);

export default router;

