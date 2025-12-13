import { Request, Response } from 'express';
import {
  TransferReservationService,
  CreateTransferReservationInput,
  UpdateTransferReservationInput,
  TransferReservationFilters,
} from '../services/transfer-reservation.service';

export class TransferReservationController {
  static async list(req: Request, res: Response) {
    try {
      const tenantId = req.query.tenantId as string;
      if (!tenantId) {
        return res.status(400).json({ message: 'tenantId query param required' });
      }

      const filters: TransferReservationFilters = {
        tenantId,
        status: req.query.status as any,
        vehicleId: req.query.vehicleId as string,
        routeId: req.query.routeId as string,
        driverId: req.query.driverId as string,
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
      };

      const reservations = await TransferReservationService.list(filters);
      res.json(reservations);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to list transfer reservations' });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.query.tenantId as string;
      if (!tenantId) {
        return res.status(400).json({ message: 'tenantId query param required' });
      }

      const reservation = await TransferReservationService.getById(id, tenantId);
      if (!reservation) {
        return res.status(404).json({ message: 'Transfer reservation not found' });
      }

      res.json(reservation);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to get transfer reservation' });
    }
  }

  static async getByReference(req: Request, res: Response) {
    try {
      const { reference } = req.params;
      const tenantId = req.query.tenantId as string;
      if (!tenantId) {
        return res.status(400).json({ message: 'tenantId query param required' });
      }

      const reservation = await TransferReservationService.getByReference(reference, tenantId);
      if (!reservation) {
        return res.status(404).json({ message: 'Transfer reservation not found' });
      }

      res.json(reservation);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to get transfer reservation' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const input: CreateTransferReservationInput = req.body;
      const reservation = await TransferReservationService.create(input);
      res.status(201).json(reservation);
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Failed to create transfer reservation' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.body.tenantId as string;
      if (!tenantId) {
        return res.status(400).json({ message: 'tenantId is required' });
      }

      const input: UpdateTransferReservationInput = req.body;
      const reservation = await TransferReservationService.update(id, tenantId, input);
      res.json(reservation);
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Failed to update transfer reservation' });
    }
  }

  static async updateStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.body.tenantId as string;
      const { status } = req.body;

      if (!tenantId) {
        return res.status(400).json({ message: 'tenantId is required' });
      }
      if (!status) {
        return res.status(400).json({ message: 'status is required' });
      }

      const reservation = await TransferReservationService.updateStatus(id, tenantId, status);
      res.json(reservation);
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Failed to update reservation status' });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.query.tenantId as string;
      if (!tenantId) {
        return res.status(400).json({ message: 'tenantId query param required' });
      }

      await TransferReservationService.delete(id, tenantId);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Failed to delete transfer reservation' });
    }
  }
}

