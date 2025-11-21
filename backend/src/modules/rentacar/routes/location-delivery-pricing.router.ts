import { Router } from 'express';
import { LocationDeliveryPricingController } from '../controllers/location-delivery-pricing.controller';

const router = Router();

router.get('/', LocationDeliveryPricingController.listByLocation);
router.post('/', LocationDeliveryPricingController.upsert);
router.post('/bulk', LocationDeliveryPricingController.bulkUpsert);
router.delete('/:id', LocationDeliveryPricingController.remove);

export default router;

