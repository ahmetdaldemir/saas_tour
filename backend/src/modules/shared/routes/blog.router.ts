import { Router } from 'express';
import { BlogController } from '../controllers/blog.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';

const router = Router();

router.use(authenticate);
router.get('/', BlogController.list);
router.get('/:id', BlogController.getById);
router.post('/', BlogController.create);
router.put('/:id', BlogController.update);
router.delete('/:id', BlogController.remove);
router.post('/generate-content', BlogController.generateContent);

export default router;

