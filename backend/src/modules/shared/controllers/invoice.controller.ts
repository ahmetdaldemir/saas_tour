import { Request, Response } from 'express';
import { InvoiceService } from '../services/invoice/invoice.service';
import { ReservationInvoiceConfigService } from '../services/invoice/invoice-config.service';
import { IntegratorRegistry } from '../services/invoice/integrator-registry';
import { AuthenticatedRequest } from '../../auth/middleware/auth.middleware';
import { authorize } from '../../auth/middleware/authorize.middleware';
import { Permission } from '../../auth/permissions';

export class InvoiceController {
  /**
   * Issue an invoice for a reservation
   * POST /invoices/issue
   */
  static async issueInvoice(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.auth) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { reservationId, forceReissue } = req.body;
      const tenantId = req.auth.tenantId;
      const userId = req.auth.sub || 'unknown';

      if (!reservationId) {
        return res.status(400).json({ message: 'reservationId is required' });
      }

      // Role check: only admins can issue invoices
      if (req.auth.role !== 'admin') {
        return res.status(403).json({ message: 'Only admins can issue invoices' });
      }

      const invoice = await InvoiceService.issueInvoice({
        reservationId,
        tenantId,
        userId,
        forceReissue: forceReissue === true,
      });

      res.json(invoice);
    } catch (error) {
      console.error('Error issuing invoice:', error);
      res.status(400).json({ message: (error as Error).message });
    }
  }

  /**
   * Get invoice for a reservation
   * GET /invoices/reservation/:reservationId
   */
  static async getInvoiceByReservation(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.auth) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { reservationId } = req.params;
      const tenantId = req.auth.tenantId;

      const invoice = await InvoiceService.getInvoiceByReservation(reservationId, tenantId);

      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }

      res.json(invoice);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  /**
   * Get all invoices for tenant
   * GET /invoices
   */
  static async getInvoices(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.auth) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const tenantId = req.auth.tenantId;
      const limit = parseInt(req.query.limit as string) || 100;
      const offset = parseInt(req.query.offset as string) || 0;

      const result = await InvoiceService.getInvoicesByTenant(tenantId, limit, offset);

      res.json(result);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  /**
   * Get integrator configuration
   * GET /invoices/integrators/:integratorKey/config
   */
  static async getIntegratorConfig(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.auth) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { integratorKey } = req.params;
      const tenantId = req.auth.tenantId;

      const config = await ReservationInvoiceConfigService.getConfig(tenantId, integratorKey);

      if (!config) {
        return res.json({});
      }

      // Mask sensitive fields (API keys, passwords, etc.)
      const maskedConfig = this.maskSensitiveFields(config);

      res.json(maskedConfig);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  /**
   * Save integrator configuration
   * PUT /invoices/integrators/:integratorKey/config
   */
  static async saveIntegratorConfig(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.auth) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { integratorKey } = req.params;
      const tenantId = req.auth.tenantId;
      const configData = req.body;

      // Role check: only admins can save config
      if (req.auth.role !== 'admin') {
        return res.status(403).json({ message: 'Only admins can save integrator config' });
      }

      const config = await ReservationInvoiceConfigService.saveConfig(
        tenantId,
        integratorKey,
        configData
      );

      // Return masked config
      const maskedConfig = this.maskSensitiveFields(config.configData);

      res.json(maskedConfig);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  /**
   * Get available integrators
   * GET /invoices/integrators
   */
  static async getAvailableIntegrators(req: Request, res: Response) {
    try {
      const integrators = IntegratorRegistry.getAvailableIntegrators();
      res.json({ integrators });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  /**
   * Mask sensitive fields in config (API keys, passwords, etc.)
   */
  private static maskSensitiveFields(config: Record<string, unknown>): Record<string, unknown> {
    const sensitiveKeys = ['apiKey', 'api_key', 'password', 'secret', 'token', 'accessToken'];
    const masked = { ...config };

    for (const key of Object.keys(masked)) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
        if (typeof masked[key] === 'string' && (masked[key] as string).length > 0) {
          masked[key] = '***';
        }
      }
    }

    return masked;
  }
}

