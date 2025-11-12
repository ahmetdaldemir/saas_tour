import { Request, Response } from 'express';
import { VehicleBrandService } from '../services/vehicle-brand.service';

export class VehicleBrandController {
  static async list(_req: Request, res: Response) {
    try {
      const brands = await VehicleBrandService.list();
      res.json(brands);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const brand = await VehicleBrandService.create(req.body);
      res.status(201).json(brand);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const brand = await VehicleBrandService.getById(id);
      if (!brand) {
        return res.status(404).json({ message: 'Vehicle brand not found' });
      }
      res.json(brand);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const brand = await VehicleBrandService.update(id, req.body);
      res.json(brand);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async remove(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await VehicleBrandService.remove(id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }
}

