import { Request, Response } from 'express';
import { TourFeatureService } from '../services/tour-feature.service';

export class TourFeatureController {
  static async list(req: Request, res: Response) {
    try {
      const languageCode = req.query.languageCode as string | undefined;
      const features = await TourFeatureService.list(languageCode);
      res.json(features);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const feature = await TourFeatureService.getById(id);
      if (!feature) {
        return res.status(404).json({ message: 'Tour feature not found' });
      }
      res.json(feature);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { icon, translations, sortOrder, isActive } = req.body;

      if (!icon || !translations || !Array.isArray(translations) || translations.length === 0) {
        return res.status(400).json({
          message: 'icon and translations array are required',
        });
      }

      const feature = await TourFeatureService.create({
        icon,
        translations,
        sortOrder,
        isActive,
      });

      res.status(201).json(feature);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { icon, translations, sortOrder, isActive } = req.body;

      const feature = await TourFeatureService.update(id, {
        icon,
        translations,
        sortOrder,
        isActive,
      });

      res.json(feature);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async remove(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await TourFeatureService.remove(id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }
}

