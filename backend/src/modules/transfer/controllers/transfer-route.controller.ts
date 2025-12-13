import { Request, Response } from 'express';
import { TransferRouteService, CreateTransferRouteInput, UpdateTransferRouteInput } from '../services/transfer-route.service';

export class TransferRouteController {
  static async list(req: Request, res: Response) {
    try {
      const tenantId = req.query.tenantId as string;
      if (!tenantId) {
        return res.status(400).json({ message: 'tenantId query param required' });
      }

      const routes = await TransferRouteService.list(tenantId);
      res.json(routes);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to list transfer routes' });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.query.tenantId as string;
      if (!tenantId) {
        return res.status(400).json({ message: 'tenantId query param required' });
      }

      const route = await TransferRouteService.getById(id, tenantId);
      if (!route) {
        return res.status(404).json({ message: 'Transfer route not found' });
      }

      res.json(route);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to get transfer route' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const input: CreateTransferRouteInput = req.body;
      const route = await TransferRouteService.create(input);
      res.status(201).json(route);
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Failed to create transfer route' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.body.tenantId as string;
      if (!tenantId) {
        return res.status(400).json({ message: 'tenantId is required' });
      }

      const input: UpdateTransferRouteInput = req.body;
      const route = await TransferRouteService.update(id, tenantId, input);
      res.json(route);
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Failed to update transfer route' });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.query.tenantId as string;
      if (!tenantId) {
        return res.status(400).json({ message: 'tenantId query param required' });
      }

      await TransferRouteService.delete(id, tenantId);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Failed to delete transfer route' });
    }
  }
}

