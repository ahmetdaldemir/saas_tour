import { Request, Response } from 'express';
import { TransferDriverService, CreateTransferDriverInput, UpdateTransferDriverInput } from '../services/transfer-driver.service';

export class TransferDriverController {
  static async list(req: Request, res: Response) {
    try {
      const tenantId = req.query.tenantId as string;
      if (!tenantId) {
        return res.status(400).json({ message: 'tenantId query param required' });
      }

      const availableOnly = req.query.availableOnly === 'true';
      const drivers = availableOnly
        ? await TransferDriverService.getAvailableDrivers(tenantId)
        : await TransferDriverService.list(tenantId);

      res.json(drivers);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to list transfer drivers' });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.query.tenantId as string;
      if (!tenantId) {
        return res.status(400).json({ message: 'tenantId query param required' });
      }

      const driver = await TransferDriverService.getById(id, tenantId);
      if (!driver) {
        return res.status(404).json({ message: 'Transfer driver not found' });
      }

      res.json(driver);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to get transfer driver' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const input: CreateTransferDriverInput = req.body;
      const driver = await TransferDriverService.create(input);
      res.status(201).json(driver);
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Failed to create transfer driver' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.body.tenantId as string;
      if (!tenantId) {
        return res.status(400).json({ message: 'tenantId is required' });
      }

      const input: UpdateTransferDriverInput = req.body;
      const driver = await TransferDriverService.update(id, tenantId, input);
      res.json(driver);
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Failed to update transfer driver' });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.query.tenantId as string;
      if (!tenantId) {
        return res.status(400).json({ message: 'tenantId query param required' });
      }

      await TransferDriverService.delete(id, tenantId);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Failed to delete transfer driver' });
    }
  }
}

