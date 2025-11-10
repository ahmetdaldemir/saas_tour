import { Request, Response } from 'express';
import { TourService } from '../services/tour.service';

export class TourController {
  static async create(req: Request, res: Response) {
    try {
      const tour = await TourService.createTour(req.body);
      res.status(201).json(tour);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async list(req: Request, res: Response) {
    const tenantId = req.query.tenantId as string;
    if (!tenantId) {
      return res.status(400).json({ message: 'tenantId query param required' });
    }

    const tours = await TourService.listTours(tenantId);
    res.json(tours);
  }
}
