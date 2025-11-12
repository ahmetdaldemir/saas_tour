import { Router } from 'express';
import { RentacarController } from '../controllers/rentacar.controller';

const router = Router();

router.get('/vehicles', RentacarController.listVehicles);
router.get('/vehicles/:id', RentacarController.getVehicle);
router.post('/vehicles', RentacarController.createVehicle);
router.put('/vehicles/:id', RentacarController.updateVehicle);
router.patch('/vehicles/:id', RentacarController.updateVehicle);
router.delete('/vehicles/:id', RentacarController.deleteVehicle);
router.post('/vehicles/:vehicleId/plates', RentacarController.addPlate);
router.put('/vehicles/:vehicleId/plates/:plateId', RentacarController.updatePlate);
router.patch('/vehicles/:vehicleId/plates/:plateId', RentacarController.updatePlate);
router.delete('/vehicles/:vehicleId/plates/:plateId', RentacarController.deletePlate);
router.post('/vehicles/:vehicleId/pricing', RentacarController.upsertPricing);
router.post('/reservations/:reservationId/assignments', RentacarController.assignPlate);

export default router;
