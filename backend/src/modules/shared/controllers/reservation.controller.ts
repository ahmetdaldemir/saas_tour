import { Response } from 'express';
import { ReservationService } from '../services/reservation.service';
import { ReservationStatus } from '../entities/reservation.entity';
import { AuthenticatedRequest } from '../../auth/middleware/auth.middleware';

export class ReservationController {
  static async list(req: AuthenticatedRequest, res: Response) {
    try {
      // Get tenantId from authenticated user's token (security)
      const tenantId = req.auth?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      const reservations = await ReservationService.list(tenantId);
      res.json(reservations);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const reservation = await ReservationService.getById(id);
      if (!reservation) {
        return res.status(404).json({ message: 'Reservation not found' });
      }
      res.json(reservation);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async updateStatus(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { status, checkIn, checkOut } = req.body as any;

      if (!status || !Object.values(ReservationStatus).includes(status)) {
        return res.status(400).json({ message: 'Valid status is required' });
      }

      const checkInDate = checkIn ? new Date(checkIn) : undefined;
      const checkOutDate = checkOut ? new Date(checkOut) : undefined;

      const reservation = await ReservationService.updateStatus(
        id,
        status,
        checkInDate,
        checkOutDate
      );

      res.json(reservation);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async update(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body as any;

      // Status'u ReservationStatus enum'una dönüştür
      if (updateData?.status && !Object.values(ReservationStatus).includes(updateData.status)) {
        return res.status(400).json({ message: 'Invalid status value' });
      }

      // Tarih alanlarını Date'e dönüştür
      if (updateData?.checkIn) {
        updateData.checkIn = new Date(updateData.checkIn);
      }
      if (updateData?.checkOut) {
        updateData.checkOut = new Date(updateData.checkOut);
      }

      const reservation = await ReservationService.update(id, updateData);
      res.json(reservation);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async addNote(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { note } = req.body as { note: string };

      if (!note || note.trim().length === 0) {
        return res.status(400).json({ message: 'Note is required' });
      }

      const reservation = await ReservationService.addNote(id, note.trim());
      res.json(reservation);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async processCheckout(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const reservation = await ReservationService.processCheckout(id);
      res.json(reservation);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async processCheckin(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const reservation = await ReservationService.processCheckin(id);
      res.json(reservation);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async cancel(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body as { reason?: string };
      const reservation = await ReservationService.cancelReservation(id, reason);
      res.json(reservation);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async sendConfirmationEmail(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      await ReservationService.sendConfirmationEmail(id);
      res.json({ message: 'Confirmation email sent successfully' });
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }
}

