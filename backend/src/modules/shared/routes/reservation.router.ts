import { Router } from 'express';
import { ReservationController } from '../controllers/reservation.controller';
import { AuthenticatedRequest } from '../../auth/middleware/auth.middleware';

const router = Router();

router.get('/', ReservationController.list);
router.get('/:id', (req, res, next) => ReservationController.getById(req as AuthenticatedRequest, res).catch(next));
router.put('/:id/status', (req, res, next) => ReservationController.updateStatus(req as AuthenticatedRequest, res).catch(next));
router.put('/:id', (req, res, next) => ReservationController.update(req as AuthenticatedRequest, res).catch(next));

export default router;

