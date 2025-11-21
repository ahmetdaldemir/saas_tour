import { Request, Response } from 'express';
import { LocationPricingService } from '../services/location-pricing.service';

export class LocationPricingController {
  static async listByLocation(req: Request, res: Response) {
    try {
      const { locationId, month } = req.query;
      if (!locationId || typeof locationId !== 'string') {
        return res.status(400).json({ message: 'Location ID is required' });
      }

      const monthNum = month ? parseInt(month as string, 10) : undefined;
      if (monthNum !== undefined && (monthNum < 1 || monthNum > 12)) {
        return res.status(400).json({ message: 'Month must be between 1 and 12' });
      }

      const pricings = await LocationPricingService.listByLocation(locationId, monthNum);
      res.json(pricings);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async getByLocationAndVehicle(req: Request, res: Response) {
    try {
      const { locationId, vehicleId, month } = req.query;
      if (!locationId || typeof locationId !== 'string') {
        return res.status(400).json({ message: 'Location ID is required' });
      }
      if (!vehicleId || typeof vehicleId !== 'string') {
        return res.status(400).json({ message: 'Vehicle ID is required' });
      }

      const monthNum = month ? parseInt(month as string, 10) : undefined;
      if (monthNum !== undefined && (monthNum < 1 || monthNum > 12)) {
        return res.status(400).json({ message: 'Month must be between 1 and 12' });
      }

      const pricings = await LocationPricingService.getByLocationAndVehicle(locationId, vehicleId, monthNum);
      res.json(pricings);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async upsert(req: Request, res: Response) {
    try {
      const pricing = await LocationPricingService.upsert(req.body);
      res.json(pricing);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async bulkUpsert(req: Request, res: Response) {
    try {
      const pricings = await LocationPricingService.bulkUpsert(req.body);
      res.json(pricings);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async remove(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await LocationPricingService.remove(id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }
}

