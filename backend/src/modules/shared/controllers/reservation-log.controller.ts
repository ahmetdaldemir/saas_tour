import { Response } from 'express';
import { ReservationLogService } from '../services/reservation-log.service';
import { ReservationLogStatus } from '../entities/reservation-log.entity';
import { AuthenticatedRequest } from '../../auth/middleware/auth.middleware';

export class ReservationLogController {
  static async list(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const status = req.query.status as ReservationLogStatus | undefined;
      const logs = await ReservationLogService.list(tenantId, status);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { id } = req.params;
      const log = await ReservationLogService.getById(id, tenantId);

      if (!log) {
        return res.status(404).json({ message: 'Reservation log not found' });
      }

      res.json(log);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async convertToReservation(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { id } = req.params;
      const reservation = await ReservationLogService.convertToReservation(id, tenantId);

      res.json({
        success: true,
        message: 'Reservation created from log',
        data: reservation,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }
}

