import { Router } from 'express';
import { RentacarController } from '../controllers/rentacar.controller';

const router = Router();

router.get('/vehicles', RentacarController.listVehicles);
router.post('/vehicles', RentacarController.createVehicle);
router.post('/vehicles/:vehicleId/plates', RentacarController.addPlate);
router.post('/vehicles/:vehicleId/pricing', RentacarController.upsertPricing);
router.post('/reservations/:reservationId/assignments', RentacarController.assignPlate);

export default router;
