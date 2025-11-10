import { Request, Response } from 'express';
import { TenantService } from '../services/tenant.service';
import { TenantCategory } from '../entities/tenant.entity';

export class TenantController {
  static async create(req: Request, res: Response) {
    try {
      const { name, slug, category, defaultLanguage, supportEmail } = req.body;

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
}
