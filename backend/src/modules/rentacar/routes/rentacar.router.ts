import { Router } from 'express';
import { RentacarController } from '../controllers/rentacar.controller';
import { AuthenticatedRequest } from '../../auth/middleware/auth.middleware';

const router = Router();

// Public endpoint - no authentication required, tenantId from query parameter
router.get('/vehicles', RentacarController.listVehicles);
router.get('/vehicles/:id', (req, res, next) => RentacarController.getVehicle(req as AuthenticatedRequest, res).catch(next));
router.post('/vehicles', RentacarController.createVehicle);
router.put('/vehicles/:id', (req, res, next) => RentacarController.updateVehicle(req as AuthenticatedRequest, res).catch(next));
router.patch('/vehicles/:id', (req, res, next) => RentacarController.updateVehicle(req as AuthenticatedRequest, res).catch(next));
router.delete('/vehicles/:id', (req, res, next) => RentacarController.deleteVehicle(req as AuthenticatedRequest, res).catch(next));
router.post('/vehicles/:vehicleId/plates', (req, res, next) => RentacarController.addPlate(req as AuthenticatedRequest, res).catch(next));
router.put('/vehicles/:vehicleId/plates/:plateId', (req, res, next) => RentacarController.updatePlate(req as AuthenticatedRequest, res).catch(next));
router.patch('/vehicles/:vehicleId/plates/:plateId', (req, res, next) => RentacarController.updatePlate(req as AuthenticatedRequest, res).catch(next));
router.delete('/vehicles/:vehicleId/plates/:plateId', (req, res, next) => RentacarController.deletePlate(req as AuthenticatedRequest, res).catch(next));
router.post('/vehicles/:vehicleId/pricing', (req, res, next) => RentacarController.upsertPricing(req as AuthenticatedRequest, res).catch(next));
router.put('/vehicles/:id/last-return-location', (req, res, next) => RentacarController.updateLastReturnLocation(req as AuthenticatedRequest, res).catch(next));
router.patch('/vehicles/:id/last-return-location', (req, res, next) => RentacarController.updateLastReturnLocation(req as AuthenticatedRequest, res).catch(next));
router.post('/reservations/:reservationId/assignments', (req, res, next) => RentacarController.assignPlate(req as AuthenticatedRequest, res).catch(next));

export default router;
