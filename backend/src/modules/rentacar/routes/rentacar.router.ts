import { Router } from 'express';
import { RentacarController } from '../controllers/rentacar.controller';
import { AuthenticatedRequest } from '../../auth/middleware/auth.middleware';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { authorize } from '../../auth/middleware/authorize.middleware';
import { Permission } from '../../auth/permissions';

const router = Router();

// Public endpoint - no authentication required, tenantId from query parameter
router.get('/vehicles', RentacarController.listVehicles);
router.get('/vehicles/:id', (req, res, next) => RentacarController.getVehicle(req as AuthenticatedRequest, res).catch(next));

// Protected endpoints - authentication and authorization required
router.use(authenticate);
router.post('/vehicles', authorize(Permission.VEHICLE_CREATE), RentacarController.createVehicle);
router.put('/vehicles/:id', authorize(Permission.VEHICLE_UPDATE), (req, res, next) => RentacarController.updateVehicle(req as AuthenticatedRequest, res).catch(next));
router.patch('/vehicles/:id', authorize(Permission.VEHICLE_UPDATE), (req, res, next) => RentacarController.updateVehicle(req as AuthenticatedRequest, res).catch(next));
router.delete('/vehicles/:id', authorize(Permission.VEHICLE_DELETE), (req, res, next) => RentacarController.deleteVehicle(req as AuthenticatedRequest, res).catch(next));
router.post('/vehicles/:vehicleId/plates', authorize(Permission.VEHICLE_UPDATE), (req, res, next) => RentacarController.addPlate(req as AuthenticatedRequest, res).catch(next));
router.put('/vehicles/:vehicleId/plates/:plateId', authorize(Permission.VEHICLE_UPDATE), (req, res, next) => RentacarController.updatePlate(req as AuthenticatedRequest, res).catch(next));
router.patch('/vehicles/:vehicleId/plates/:plateId', authorize(Permission.VEHICLE_UPDATE), (req, res, next) => RentacarController.updatePlate(req as AuthenticatedRequest, res).catch(next));
router.delete('/vehicles/:vehicleId/plates/:plateId', authorize(Permission.VEHICLE_UPDATE), (req, res, next) => RentacarController.deletePlate(req as AuthenticatedRequest, res).catch(next));
router.post('/vehicles/:vehicleId/pricing', authorize(Permission.VEHICLE_UPDATE), (req, res, next) => RentacarController.upsertPricing(req as AuthenticatedRequest, res).catch(next));
router.put('/vehicles/:id/last-return-location', authorize(Permission.VEHICLE_UPDATE), (req, res, next) => RentacarController.updateLastReturnLocation(req as AuthenticatedRequest, res).catch(next));
router.patch('/vehicles/:id/last-return-location', authorize(Permission.VEHICLE_UPDATE), (req, res, next) => RentacarController.updateLastReturnLocation(req as AuthenticatedRequest, res).catch(next));
router.post('/reservations/:reservationId/assignments', authorize(Permission.RESERVATION_UPDATE), (req, res, next) => RentacarController.assignPlate(req as AuthenticatedRequest, res).catch(next));

export default router;
