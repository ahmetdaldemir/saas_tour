import { Router } from 'express';
import { TenantController } from '../controllers/tenant.controller';

const router = Router();

router.get('/', TenantController.list);
router.post('/', TenantController.create);
router.get('/:id', TenantController.getById);
router.put('/:id', TenantController.update);
router.patch('/:id/default-currency', TenantController.updateDefaultCurrency);

export default router;
