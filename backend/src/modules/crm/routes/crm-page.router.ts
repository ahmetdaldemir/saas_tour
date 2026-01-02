import { Router } from 'express';
import { CrmPageController } from '../controllers/crm-page.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { authorize } from '../../auth/middleware/authorize.middleware';
import { Permission } from '../../auth/permissions';

const router = Router();

// Public endpoints (for API/frontend)
router.get('/', CrmPageController.list);
router.get('/slug/:slug', CrmPageController.getBySlug);
router.get('/:id', CrmPageController.getById);

// Protected endpoints (for admin panel)
router.use(authenticate);
router.post('/', authorize(Permission.CRM_CREATE), CrmPageController.create);
router.put('/:id', authorize(Permission.CRM_UPDATE), CrmPageController.update);
router.delete('/:id', authorize(Permission.CRM_DELETE), CrmPageController.remove);

export default router;

