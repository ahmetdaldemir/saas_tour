import { Router } from 'express';
import { EmailTemplateController } from '../controllers/email-template.controller';
import { AuthenticatedRequest } from '../../auth/middleware/auth.middleware';
import { authenticate } from '../../auth/middleware/auth.middleware';

const router = Router();

// Public endpoints - no authentication required
router.get('/', EmailTemplateController.list);
router.get('/type', EmailTemplateController.getByType);
router.get('/:id', (req, res, next) => EmailTemplateController.getById(req as AuthenticatedRequest, res).catch(next));

// Protected endpoints - authentication required
router.use(authenticate);
router.post('/', EmailTemplateController.create);
router.put('/:id', (req, res, next) => EmailTemplateController.update(req as AuthenticatedRequest, res).catch(next));
router.delete('/:id', (req, res, next) => EmailTemplateController.delete(req as AuthenticatedRequest, res).catch(next));

export default router;

