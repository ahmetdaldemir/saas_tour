import { Request, Response } from 'express';
import { VehicleCategoryService } from '../services/vehicle-category.service';

export class VehicleCategoryController {
  static async list(req: Request, res: Response) {
    try {
      const languageId = req.query.languageId as string | undefined;
      const categories = await VehicleCategoryService.list(languageId);
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const category = await VehicleCategoryService.create(req.body);
      res.status(201).json(category);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const category = await VehicleCategoryService.getById(id);
      if (!category) {
        return res.status(404).json({ message: 'Vehicle category not found' });
      }
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const category = await VehicleCategoryService.update(id, req.body);
      res.json(category);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async remove(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await VehicleCategoryService.remove(id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }
}

