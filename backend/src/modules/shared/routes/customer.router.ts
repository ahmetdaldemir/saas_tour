import { Router } from 'express';
import { CustomerController } from '../controllers/customer.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';

const router = Router();

router.get('/', authenticate, CustomerController.list);
router.get('/:id', authenticate, CustomerController.getById);
router.post('/', authenticate, CustomerController.create);
router.put('/:id', authenticate, CustomerController.update);
router.delete('/:id', authenticate, CustomerController.remove);

export default router;

