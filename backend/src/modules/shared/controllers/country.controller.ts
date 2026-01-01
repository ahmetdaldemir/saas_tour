import { Response } from 'express';
import { CountryService, CreateCountryInput, UpdateCountryInput } from '../services/country.service';
import { AuthenticatedRequest } from '../../auth/middleware/auth.middleware';

export class CountryController {
  static async list(req: AuthenticatedRequest | any, res: Response) {
    try {
      const { activeOnly } = req.query;
      
      const countries = activeOnly === 'true' 
        ? await CountryService.listActive()
        : await CountryService.list();
      
      res.json(countries);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const country = await CountryService.getById(id);
      
      if (!country) {
        return res.status(404).json({ message: 'Country not found' });
      }
      
      res.json(country);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      const input = req.body as CreateCountryInput;
      
      if (!input.name || !input.code || !input.phoneCode) {
        return res.status(400).json({ 
          message: 'name, code, and phoneCode are required' 
        });
      }

      const country = await CountryService.create(input);
      res.status(201).json(country);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async update(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const input = req.body as UpdateCountryInput;

      const country = await CountryService.update(id, input);
      res.json(country);
    } catch (error) {
      const errorMessage = (error as Error).message;
      if (errorMessage === 'Country not found') {
        return res.status(404).json({ message: errorMessage });
      }
      res.status(400).json({ message: errorMessage });
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      await CountryService.delete(id);
      res.json({ message: 'Country deleted successfully' });
    } catch (error) {
      const errorMessage = (error as Error).message;
      if (errorMessage === 'Country not found') {
        return res.status(404).json({ message: errorMessage });
      }
      res.status(400).json({ message: errorMessage });
    }
  }

  static async toggleActive(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const country = await CountryService.toggleActive(id);
      res.json(country);
    } catch (error) {
      const errorMessage = (error as Error).message;
      if (errorMessage === 'Country not found') {
        return res.status(404).json({ message: errorMessage });
      }
      res.status(400).json({ message: errorMessage });
    }
  }

  /**
   * Sync countries from external API or seed data
   * This will update/create countries automatically
   */
  static async sync(req: AuthenticatedRequest, res: Response) {
    try {
      const result = await CountryService.syncCountries();
      res.json({
        message: 'Countries synced successfully',
        created: result.created,
        updated: result.updated,
        total: result.total,
      });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }
}
