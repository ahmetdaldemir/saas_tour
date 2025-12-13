import { Request, Response } from 'express';
import { TransferPricingService, CreateTransferPricingInput, UpdateTransferPricingInput } from '../services/transfer-pricing.service';

export class TransferPricingController {
  static async list(req: Request, res: Response) {
    try {
      const tenantId = req.query.tenantId as string;
      if (!tenantId) {
        return res.status(400).json({ message: 'tenantId query param required' });
      }

      const filters: any = {};
      if (req.query.vehicleId) {
        filters.vehicleId = req.query.vehicleId as string;
      }
      if (req.query.routeId) {
        filters.routeId = req.query.routeId as string;
      }

      const pricings = await TransferPricingService.list(tenantId, filters);
      res.json(pricings);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to list transfer pricings' });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.query.tenantId as string;
      if (!tenantId) {
        return res.status(400).json({ message: 'tenantId query param required' });
      }

      const pricing = await TransferPricingService.getById(id, tenantId);
      if (!pricing) {
        return res.status(404).json({ message: 'Transfer pricing not found' });
      }

      res.json(pricing);
    } catch (error: any) {
      res.status(500).json({ message: error.message || 'Failed to get transfer pricing' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const input: CreateTransferPricingInput = req.body;
      const pricing = await TransferPricingService.create(input);
      res.status(201).json(pricing);
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Failed to create transfer pricing' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.body.tenantId as string;
      if (!tenantId) {
        return res.status(400).json({ message: 'tenantId is required' });
      }

      const input: UpdateTransferPricingInput = req.body;
      const pricing = await TransferPricingService.update(id, tenantId, input);
      res.json(pricing);
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Failed to update transfer pricing' });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.query.tenantId as string;
      if (!tenantId) {
        return res.status(400).json({ message: 'tenantId query param required' });
      }

      await TransferPricingService.delete(id, tenantId);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Failed to delete transfer pricing' });
    }
  }

  static async calculatePrice(req: Request, res: Response) {
    try {
      const { vehicleId, routeId, isRoundTrip, isNightRate, extraServices } = req.body;

      if (!vehicleId || !routeId) {
        return res.status(400).json({ message: 'vehicleId and routeId are required' });
      }

      const result = await TransferPricingService.calculatePrice({
        vehicleId,
        routeId,
        isRoundTrip: isRoundTrip ?? false,
        isNightRate: isNightRate ?? false,
        extraServices,
      });

      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message || 'Failed to calculate price' });
    }
  }
}

