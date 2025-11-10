import { Router } from 'express';
import { TenantController } from '../controllers/tenant.controller';

const router = Router();

router.get('/', TenantController.list);
router.post('/', TenantController.create);

export default router;
