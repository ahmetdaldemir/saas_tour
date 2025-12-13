import { Router } from 'express';
import { EmailTemplateController } from '../controllers/email-template.controller';

const router = Router();

router.get('/', EmailTemplateController.list);
router.get('/type', EmailTemplateController.getByType);
router.get('/:id', EmailTemplateController.getById);
router.post('/', EmailTemplateController.create);
router.put('/:id', EmailTemplateController.update);
router.delete('/:id', EmailTemplateController.delete);

export default router;

