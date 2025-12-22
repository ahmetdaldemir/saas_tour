import { Router } from 'express';
import { EmailTemplateController } from '../controllers/email-template.controller';
import { AuthenticatedRequest } from '../../auth/middleware/auth.middleware';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { authorize } from '../../auth/middleware/authorize.middleware';
import { Permission } from '../../auth/permissions';

const router = Router();

// Public endpoints - no authentication required
router.get('/', EmailTemplateController.list);
router.get('/type', EmailTemplateController.getByType);
router.get('/:id', (req, res, next) => EmailTemplateController.getById(req as AuthenticatedRequest, res).catch(next));

// Protected endpoints - authentication and authorization required
router.use(authenticate);
router.post('/', authorize(Permission.EMAIL_TEMPLATE_CREATE), EmailTemplateController.create);
router.put('/:id', authorize(Permission.EMAIL_TEMPLATE_UPDATE), (req, res, next) => EmailTemplateController.update(req as AuthenticatedRequest, res).catch(next));
router.delete('/:id', authorize(Permission.EMAIL_TEMPLATE_DELETE), (req, res, next) => EmailTemplateController.delete(req as AuthenticatedRequest, res).catch(next));

export default router;

