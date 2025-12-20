import { Request, Response } from 'express';
import { LocationService } from '../services/location.service';

export class LocationController {
  static async list(req: Request, res: Response) {
    try {
      const tenantId = req.query.tenantId as string;
      const parentId = req.query.parentId as string | undefined;
      const languageId = req.query.languageId as string | undefined;

      if (!tenantId) {
        return res.status(400).json({ message: 'tenantId query param required' });
      }

      const locations = await LocationService.list(tenantId, parentId, languageId);
      res.json(locations);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const location = await LocationService.create(req.body);
      res.status(201).json(location);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const location = await LocationService.getById(id);
      if (!location) {
        return res.status(404).json({ message: 'Location not found' });
      }
      res.json(location);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const location = await LocationService.update(id, req.body);
      res.json(location);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async remove(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await LocationService.remove(id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }
}

