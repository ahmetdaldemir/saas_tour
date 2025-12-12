import { Request, Response } from 'express';
import { CurrencyService } from '../services/currency.service';
import { CurrencyCode } from '../entities/currency.entity';

export class CurrencyController {
  static async list(_req: Request, res: Response) {
    try {
      const currencies = await CurrencyService.list();
      res.json(currencies);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { code, name, symbol, rateToTry, isBaseCurrency, isActive, autoUpdate } = req.body;

      if (!code || !name) {
        return res.status(400).json({ message: 'code and name are required' });
      }

      if (!Object.values(CurrencyCode).includes(code)) {
        return res.status(400).json({ message: 'invalid currency code' });
      }

      const currency = await CurrencyService.create({
        code,
        name,
        symbol,
        rateToTry,
        isBaseCurrency,
        isActive,
        autoUpdate,
      });

      res.status(201).json(currency);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { code, name, symbol, rateToTry, isBaseCurrency, isActive, autoUpdate } = req.body;

      const currency = await CurrencyService.update(id, {
        code,
        name,
        symbol,
        rateToTry,
        isBaseCurrency,
        isActive,
        autoUpdate,
      });

      res.json(currency);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async updateRate(req: Request, res: Response) {
    try {
      const { code } = req.params;
      const { rateToTry } = req.body;

      if (!rateToTry || typeof rateToTry !== 'number') {
        return res.status(400).json({ message: 'rateToTry is required and must be a number' });
      }

      if (!Object.values(CurrencyCode).includes(code as CurrencyCode)) {
        return res.status(400).json({ message: 'invalid currency code' });
      }

      const currency = await CurrencyService.updateRate(code as CurrencyCode, rateToTry);
      res.json(currency);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async updateRates(req: Request, res: Response) {
    try {
      await CurrencyService.updateExchangeRates();
      const currencies = await CurrencyService.list();
      res.json({
        message: 'Exchange rates updated successfully',
        currencies,
      });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async updateSingleRate(req: Request, res: Response) {
    try {
      const { code } = req.params;

      if (!Object.values(CurrencyCode).includes(code as CurrencyCode)) {
        return res.status(400).json({ message: 'invalid currency code' });
      }

      const currency = await CurrencyService.updateSingleCurrencyRate(code as CurrencyCode);
      res.json(currency);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async remove(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await CurrencyService.remove(id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }
}

