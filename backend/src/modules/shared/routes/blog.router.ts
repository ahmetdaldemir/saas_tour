import { Router } from 'express';
import { BlogController } from '../controllers/blog.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';

const router = Router();

// Public endpoints - no authentication required
router.get('/', BlogController.list);
router.get('/:id', BlogController.getById);

// Protected endpoints - authentication required
router.use(authenticate);
router.post('/', BlogController.create);
router.put('/:id', BlogController.update);
router.delete('/:id', BlogController.remove);
router.post('/generate-content', BlogController.generateContent);

export default router;

