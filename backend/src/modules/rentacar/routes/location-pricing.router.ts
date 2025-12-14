import { Router } from 'express';
import { LocationPricingController } from '../controllers/location-pricing.controller';

const router = Router();

router.get('/', LocationPricingController.listByLocation);
router.get('/by-vehicle', LocationPricingController.getByLocationAndVehicle);
router.post('/', LocationPricingController.upsert);
router.post('/bulk', LocationPricingController.bulkUpsert);
router.post('/bulk-copy', LocationPricingController.bulkCopyPrice);
router.delete('/:id', LocationPricingController.remove);

export default router;

