import { Response } from 'express';
import { TenantSettingsService } from '../services/tenant-settings.service';
import { SettingsCategory, TenantSettings } from '../entities/tenant-settings.entity';
import { AuthenticatedRequest } from '../../auth/middleware/auth.middleware';

export class TenantSettingsController {
  static async getAll(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.auth) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const tenantId = req.auth.tenantId;
      const settings = await TenantSettingsService.getByTenant(tenantId);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async getSite(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.auth) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const tenantId = req.auth.tenantId;
      const settings = await TenantSettingsService.getSiteSettings(tenantId);
      res.json(settings || {});
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async getMail(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.auth) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const tenantId = req.auth.tenantId;
      const settings = await TenantSettingsService.getMailSettings(tenantId);
      
      // Mask password in response
      if (settings && settings.smtpPassword) {
        settings.smtpPassword = '***';
      }
      
      res.json(settings || {});
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async getPayment(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.auth) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const tenantId = req.auth.tenantId;
      const settings = await TenantSettingsService.getPaymentSettings(tenantId);
      res.json(settings || {});
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async updateSite(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.auth) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const tenantId = req.auth.tenantId;
      const { siteName, siteDescription, logoUrl, faviconUrl } = req.body;

      const settings = await TenantSettingsService.updateSiteSettings(tenantId, {
        siteName,
        siteDescription,
        logoUrl,
        faviconUrl,
      });

      res.json(settings);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async updateMail(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.auth) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const tenantId = req.auth.tenantId;
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

  static async updatePayment(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.auth) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const tenantId = req.auth.tenantId;
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

