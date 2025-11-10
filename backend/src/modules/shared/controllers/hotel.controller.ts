import { Response } from 'express';
import { AuthenticatedRequest } from '../../auth/middleware/auth.middleware';
import { HotelService } from '../services/hotel.service';

export class HotelController {
  static async list(req: AuthenticatedRequest, res: Response) {
    if (!req.auth) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const hotels = await HotelService.list();
    res.json(hotels);
  }

  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.auth) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { name, starRating, address, city, country, destinationId, description, locationUrl } = req.body;
      if (!name || !address || !city || !country || !destinationId) {
        return res.status(400).json({ message: 'name, address, city, country and destinationId are required' });
      }

      const hotel = await HotelService.create({
        name,
        starRating,
        address,
        city,
        country,
        destinationId,
        description,
        locationUrl,
      });

      res.status(201).json(hotel);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async update(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.auth) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { id } = req.params;
      const { name, starRating, address, city, country, destinationId, description, locationUrl } = req.body;
      const hotel = await HotelService.update(id, {
        name,
        starRating,
        address,
        city,
        country,
        destinationId,
        description,
        locationUrl,
      });

      res.json(hotel);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async remove(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.auth) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { id } = req.params;
      await HotelService.remove(id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }
}
