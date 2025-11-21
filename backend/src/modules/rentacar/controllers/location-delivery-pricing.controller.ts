import { Request, Response } from 'express';
import { LocationDeliveryPricingService } from '../services/location-delivery-pricing.service';

export class LocationDeliveryPricingController {
  static async listByLocation(req: Request, res: Response) {
    try {
      const { locationId } = req.query;
      if (!locationId || typeof locationId !== 'string') {
        return res.status(400).json({ message: 'Location ID is required' });
      }

      const pricings = await LocationDeliveryPricingService.listByLocation(locationId);
      res.json(pricings);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async upsert(req: Request, res: Response) {
    try {
      const pricing = await LocationDeliveryPricingService.upsert(req.body);
      res.json(pricing);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async bulkUpsert(req: Request, res: Response) {
    try {
      const pricings = await LocationDeliveryPricingService.bulkUpsert(req.body);
      res.json(pricings);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async remove(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await LocationDeliveryPricingService.remove(id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }
}

