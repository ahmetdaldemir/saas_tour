import { Request, Response } from 'express';
import { MasterLocationService } from '../services/master-location.service';

export class MasterLocationController {
  static async list(req: Request, res: Response) {
    try {
      const parentId = req.query.parentId as string | undefined;

      const locations = await MasterLocationService.list(parentId);
      res.json(locations);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const location = await MasterLocationService.getById(id);
      if (!location) {
        return res.status(404).json({ message: 'Location not found' });
      }
      res.json(location);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const location = await MasterLocationService.create(req.body);
      res.status(201).json(location);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const location = await MasterLocationService.update(id, req.body);
      res.json(location);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async remove(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await MasterLocationService.remove(id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }
}

