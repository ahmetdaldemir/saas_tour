import { Request, Response } from 'express';
import { TenantSettingsService } from '../services/tenant-settings.service';
import { SettingsCategory } from '../entities/tenant-settings.entity';

export class TenantSettingsController {
  static async getAll(req: Request, res: Response) {
    try {
      const tenantId = req.query.tenantId as string;
      if (!tenantId) {
        return res.status(400).json({ message: 'tenantId query param required' });
      }

      const settings = await TenantSettingsService.getByTenant(tenantId);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async getSite(req: Request, res: Response) {
    try {
      const tenantId = req.query.tenantId as string;
      if (!tenantId) {
        return res.status(400).json({ message: 'tenantId query param required' });
      }

      const settings = await TenantSettingsService.getSiteSettings(tenantId);
      res.json(settings || {});
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async getMail(req: Request, res: Response) {
    try {
      const tenantId = req.query.tenantId as string;
      if (!tenantId) {
        return res.status(400).json({ message: 'tenantId query param required' });
      }

      const settings = await TenantSettingsService.getMailSettings(tenantId);
      res.json(settings || {});
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async getPayment(req: Request, res: Response) {
    try {
      const tenantId = req.query.tenantId as string;
      if (!tenantId) {
        return res.status(400).json({ message: 'tenantId query param required' });
      }

      const settings = await TenantSettingsService.getPaymentSettings(tenantId);
      res.json(settings || {});
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async updateSite(req: Request, res: Response) {
    try {
      const tenantId = req.body.tenantId as string;
      if (!tenantId) {
        return res.status(400).json({ message: 'tenantId is required' });
      }

      const { siteName, siteDescription, logoUrl, faviconUrl, defaultCurrencyId } = req.body;

      const settings = await TenantSettingsService.updateSiteSettings(tenantId, {
        siteName,
        siteDescription,
        logoUrl,
        faviconUrl,
        defaultCurrencyId,
      });

      res.json(settings);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async updateMail(req: Request, res: Response) {
    try {
      const tenantId = req.body.tenantId as string;
      if (!tenantId) {
        return res.status(400).json({ message: 'tenantId is required' });
      }

      const {
        smtpHost,
        smtpPort,
        smtpUser,
        smtpPassword,
        smtpSecure,
        fromEmail,
        fromName,
      } = req.body;

      const settings = await TenantSettingsService.updateMailSettings(tenantId, {
        smtpHost,
        smtpPort,
        smtpUser,
        smtpPassword,
        smtpSecure,
        fromEmail,
        fromName,
      });

      // Don't send password back in response
      const response = { ...settings };
      if (response.smtpPassword) {
        response.smtpPassword = '***';
      }

      res.json(response);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async updatePayment(req: Request, res: Response) {
    try {
      const tenantId = req.body.tenantId as string;
      if (!tenantId) {
        return res.status(400).json({ message: 'tenantId is required' });
      }

      const { paymentDefaultMethodId } = req.body;

      const settings = await TenantSettingsService.updatePaymentSettings(tenantId, {
        paymentDefaultMethodId,
      });

      res.json(settings);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }
}

