import { Request, Response } from 'express';
import { TransferVehicleService, CreateTransferVehicleInput, UpdateTransferVehicleInput } from '../services/transfer-vehicle.service';

export class TransferVehicleController {
  static async list(req: Request, res: Response) {
    try {
      const tenantId = req.query.tenantId as string;
      if (!tenantId) {
        return res.status(400).json({ message: 'tenantId query param required' });
      }

      const vehicles = await TransferVehicleService.list(tenantId);
      res.json(vehicles);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to list transfer vehicles' });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.query.tenantId as string;
      if (!tenantId) {
        return res.status(400).json({ message: 'tenantId query param required' });
      }

      const vehicle = await TransferVehicleService.getById(id, tenantId);
      if (!vehicle) {
        return res.status(404).json({ message: 'Transfer vehicle not found' });
      }

      res.json(vehicle);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to get transfer vehicle' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const input: CreateTransferVehicleInput = req.body;
      const vehicle = await TransferVehicleService.create(input);
      res.status(201).json(vehicle);
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Failed to create transfer vehicle' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.body.tenantId as string;
      if (!tenantId) {
        return res.status(400).json({ message: 'tenantId is required' });
      }

      const input: UpdateTransferVehicleInput = req.body;
      const vehicle = await TransferVehicleService.update(id, tenantId, input);
      res.json(vehicle);
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Failed to update transfer vehicle' });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.query.tenantId as string;
      if (!tenantId) {
        return res.status(400).json({ message: 'tenantId query param required' });
      }

      await TransferVehicleService.delete(id, tenantId);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Failed to delete transfer vehicle' });
    }
  }
}

