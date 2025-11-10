import { Router } from 'express';
import { LanguageController } from '../controllers/language.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';

const router = Router();

router.get('/', LanguageController.list);
router.post('/', authenticate, LanguageController.create);
router.patch('/:id', authenticate, LanguageController.update);
router.delete('/:id', authenticate, LanguageController.remove);

export default router;
