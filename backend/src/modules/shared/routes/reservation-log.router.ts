import { Router } from 'express';
import { ReservationLogController } from '../controllers/reservation-log.controller';
import { AuthenticatedRequest } from '../../auth/middleware/auth.middleware';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { authorize } from '../../auth/middleware/authorize.middleware';
import { Permission } from '../../auth/permissions';

const router = Router();

router.use(authenticate);
router.get('/', authorize(Permission.RESERVATION_VIEW), (req, res, next) => ReservationLogController.list(req as AuthenticatedRequest, res).catch(next));
router.get('/:id', authorize(Permission.RESERVATION_VIEW), (req, res, next) => ReservationLogController.getById(req as AuthenticatedRequest, res).catch(next));
router.post('/:id/convert', authorize(Permission.RESERVATION_CREATE), (req, res, next) => ReservationLogController.convertToReservation(req as AuthenticatedRequest, res).catch(next));

export default router;

