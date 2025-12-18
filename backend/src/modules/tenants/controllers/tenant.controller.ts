import { Request, Response } from 'express';
import { TenantService } from '../services/tenant.service';
import { TenantCategory } from '../entities/tenant.entity';

export class TenantController {
  static async create(req: Request, res: Response) {
    try {
      const { name, slug, category, defaultLanguage, supportEmail, defaultCurrencyId } = req.body;

      if (!name || !slug || !category) {
        return res.status(400).json({ message: 'name, slug and category are required' });
      }

      if (!Object.values(TenantCategory).includes(category)) {
        return res.status(400).json({ message: 'invalid category' });
      }

      const tenant = await TenantService.createTenant({
        name,
        slug,
        category,
        defaultLanguage,
        supportEmail,
        defaultCurrencyId,
      });

      res.status(201).json(tenant);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async list(_req: Request, res: Response) {
    const tenants = await TenantService.listTenants();
    res.json(tenants);
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const tenant = await TenantService.getTenantById(id);
      if (!tenant) {
        return res.status(404).json({ message: 'Tenant not found' });
      }
      res.json(tenant);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, slug, category, defaultLanguage, supportEmail, defaultCurrencyId } = req.body;

      const tenant = await TenantService.updateTenant(id, {
        name,
        slug,
        category,
        defaultLanguage,
        supportEmail,
        defaultCurrencyId,
      });

      res.json(tenant);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async updateDefaultCurrency(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { defaultCurrencyId } = req.body;

      const tenant = await TenantService.updateDefaultCurrency(id, defaultCurrencyId);
      res.json(tenant);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }
}
