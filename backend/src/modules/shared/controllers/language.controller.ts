import { Request, Response } from 'express';
import { LanguageService } from '../services/language.service';

export class LanguageController {
  static async list(_req: Request, res: Response) {
    const languages = await LanguageService.list();
    res.json(languages);
  }

  static async create(req: Request, res: Response) {
    try {
      const { code, name, isActive, isDefault } = req.body;
      if (!code || !name) {
        return res.status(400).json({ message: 'code and name are required' });
      }

      const language = await LanguageService.create({ code, name, isActive, isDefault });
      res.status(201).json(language);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { code, name, isActive, isDefault } = req.body;
      const language = await LanguageService.update(id, { code, name, isActive, isDefault });
      res.json(language);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async setDefault(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const language = await LanguageService.setDefault(id);
      res.json(language);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async remove(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await LanguageService.remove(id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }
}
