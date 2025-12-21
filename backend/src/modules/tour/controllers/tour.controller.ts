import { Response } from 'express';
import { TourService } from '../services/tour.service';
import { AuthenticatedRequest } from '../../auth/middleware/auth.middleware';

export class TourController {
  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      // Get tenantId from authenticated user's token (security: prevent tenant spoofing)
      const tenantId = req.auth?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Override tenantId from body to prevent security issues
      const tour = await TourService.createTour({
        ...req.body,
        tenantId, // Always use authenticated user's tenantId
      });
      res.status(201).json(tour);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async list(req: AuthenticatedRequest, res: Response) {
    // Get tenantId from authenticated user's token (security)
    const tenantId = req.auth?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const tours = await TourService.listTours(tenantId);
    res.json(tours);
  }

  static async getById(req: AuthenticatedRequest, res: Response) {
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

  static async update(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      // Get tenantId from authenticated user's token (security)
      const tenantId = req.auth?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Ensure tenantId matches authenticated user's tenant
      const tour = await TourService.updateTour(id, {
        ...req.body,
        tenantId, // Always use authenticated user's tenantId
      });
      res.json(tour);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async remove(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      // Get tenantId from authenticated user's token (security)
      const tenantId = req.auth?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      await TourService.removeTour(id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }
}
