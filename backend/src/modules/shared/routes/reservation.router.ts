import { Router } from 'express';
import { ReservationController } from '../controllers/reservation.controller';
import { AuthenticatedRequest } from '../../auth/middleware/auth.middleware';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { authorize } from '../../auth/middleware/authorize.middleware';
import { Permission } from '../../auth/permissions';

const router = Router();

router.use(authenticate);
router.get('/', authorize(Permission.RESERVATION_VIEW), ReservationController.list);
router.get('/:id', authorize(Permission.RESERVATION_VIEW), (req, res, next) => ReservationController.getById(req as AuthenticatedRequest, res).catch(next));
router.put('/:id/status', authorize(Permission.RESERVATION_UPDATE), (req, res, next) => ReservationController.updateStatus(req as AuthenticatedRequest, res).catch(next));
router.put('/:id', authorize(Permission.RESERVATION_UPDATE), (req, res, next) => ReservationController.update(req as AuthenticatedRequest, res).catch(next));
router.post('/:id/notes', authorize(Permission.RESERVATION_UPDATE), (req, res, next) => ReservationController.addNote(req as AuthenticatedRequest, res).catch(next));
router.post('/:id/checkout', authorize(Permission.RESERVATION_UPDATE), (req, res, next) => ReservationController.processCheckout(req as AuthenticatedRequest, res).catch(next));
router.post('/:id/checkin', authorize(Permission.RESERVATION_UPDATE), (req, res, next) => ReservationController.processCheckin(req as AuthenticatedRequest, res).catch(next));
router.post('/:id/cancel', authorize(Permission.RESERVATION_UPDATE), (req, res, next) => ReservationController.cancel(req as AuthenticatedRequest, res).catch(next));
router.post('/:id/send-confirmation-email', authorize(Permission.RESERVATION_UPDATE), (req, res, next) => ReservationController.sendConfirmationEmail(req as AuthenticatedRequest, res).catch(next));

export default router;

