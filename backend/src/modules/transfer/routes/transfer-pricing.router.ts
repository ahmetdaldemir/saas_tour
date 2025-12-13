import { Router } from 'express';
import { TransferPricingController } from '../controllers/transfer-pricing.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', TransferPricingController.list);
router.get('/:id', TransferPricingController.getById);
router.post('/', TransferPricingController.create);
router.post('/calculate', TransferPricingController.calculatePrice);
router.put('/:id', TransferPricingController.update);
router.delete('/:id', TransferPricingController.delete);

export { router as transferPricingRouter };

