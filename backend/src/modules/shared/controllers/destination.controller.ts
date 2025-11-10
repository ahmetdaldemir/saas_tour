import { Response } from 'express';
import { DestinationService } from '../services/destination.service';
import { AuthenticatedRequest } from '../../auth/middleware/auth.middleware';
import { DestinationImportService } from '../services/destination-import.service';

export class DestinationController {
  static async list(_req: AuthenticatedRequest, res: Response) {
    const destinations = await DestinationService.list();
    res.json(destinations);
  }

  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      const { name, country, city } = req.body;
      if (!name || !country || !city) {
        return res.status(400).json({ message: 'name, country and city are required' });
      }

      const destination = await DestinationService.create({
        name,
        country,
        city,
      });

      res.status(201).json(destination);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async update(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { name, country, city } = req.body;
      const destination = await DestinationService.update(id, {
        name,
        country,
        city,
      });

      res.json(destination);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async remove(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      await DestinationService.remove(id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async importFromApi(req: AuthenticatedRequest, res: Response) {
    try {
      const { city, radius, limit } = req.body;
      if (!city) {
        return res.status(400).json({ message: 'city is required' });
      }

      const result = await DestinationImportService.importGlobal({
        city,
        radius,
        limit,
      });

      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }
}
