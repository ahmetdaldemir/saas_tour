import { Request, Response } from 'express';
import { VehicleModelService } from '../services/vehicle-model.service';

export class VehicleModelController {
  static async list(req: Request, res: Response) {
    try {
      const brandId = req.query.brandId as string | undefined;
      const models = await VehicleModelService.list(brandId);
      res.json(models);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const model = await VehicleModelService.create(req.body);
      res.status(201).json(model);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const model = await VehicleModelService.getById(id);
      if (!model) {
        return res.status(404).json({ message: 'Vehicle model not found' });
      }
      res.json(model);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const model = await VehicleModelService.update(id, req.body);
      res.json(model);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async remove(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await VehicleModelService.remove(id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }
}

