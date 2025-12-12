import { Request, Response } from 'express';
import { ReservationService } from '../services/reservation.service';
import { ReservationStatus } from '../entities/reservation.entity';

export class ReservationController {
  static async list(req: Request, res: Response) {
    try {
      const tenantId = req.query.tenantId as string;
      if (!tenantId) {
        return res.status(400).json({ message: 'tenantId query param required' });
      }
      const reservations = await ReservationService.list(tenantId);
      res.json(reservations);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async getById(req: Request, res: Response) {
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

  static async updateStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, checkIn, checkOut } = req.body;

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

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Status'u ReservationStatus enum'una dönüştür
      if (updateData.status && !Object.values(ReservationStatus).includes(updateData.status)) {
        return res.status(400).json({ message: 'Invalid status value' });
      }

      // Tarih alanlarını Date'e dönüştür
      if (updateData.checkIn) {
        updateData.checkIn = new Date(updateData.checkIn);
      }
      if (updateData.checkOut) {
        updateData.checkOut = new Date(updateData.checkOut);
      }

      const reservation = await ReservationService.update(id, updateData);
      res.json(reservation);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }
}

