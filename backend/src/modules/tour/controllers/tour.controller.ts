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

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tour = await TourService.getTourById(id);
      if (!tour) {
        return res.status(404).json({ message: 'Tour not found' });
      }
      res.json(tour);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tour = await TourService.updateTour(id, req.body);
      res.json(tour);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async remove(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await TourService.removeTour(id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }
}
