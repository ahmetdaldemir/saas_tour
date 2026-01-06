import { Response } from 'express';
import { TenantMessageService } from '../services/tenant-message.service';
import { AuthenticatedRequest } from '../../auth/middleware/auth.middleware';

export class TenantMessageController {
  static async list(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.query.tenantId as string;
      if (!tenantId) {
        return res.status(400).json({ message: 'tenantId query param required' });
      }

      const messages = await TenantMessageService.list(tenantId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.query.tenantId as string;

      if (!tenantId) {
        return res.status(400).json({ message: 'tenantId query param required' });
      }

      const message = await TenantMessageService.getById(id, tenantId);
      if (!message) {
        return res.status(404).json({ message: 'Mesaj bulunamadı' });
      }

      res.json(message);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.query.tenantId as string;
      if (!tenantId) {
        return res.status(400).json({ message: 'tenantId query param required' });
      }

      const { title, message, type } = req.body;
      if (!title || !message) {
        return res.status(400).json({ message: 'title ve message gerekli' });
      }

      const createdMessage = await TenantMessageService.create({
        tenantId,
        title,
        message,
        type,
        createdById: req.auth?.sub,
      });

      res.status(201).json(createdMessage);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async update(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.query.tenantId as string;

      if (!tenantId) {
        return res.status(400).json({ message: 'tenantId query param required' });
      }

      const updatedMessage = await TenantMessageService.update(id, tenantId, req.body);
      res.json(updatedMessage);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.query.tenantId as string;

      if (!tenantId) {
        return res.status(400).json({ message: 'tenantId query param required' });
      }

      await TenantMessageService.delete(id, tenantId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async markAsRead(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const tenantId = req.query.tenantId as string;

      if (!tenantId) {
        return res.status(400).json({ message: 'tenantId query param required' });
      }

      const message = await TenantMessageService.markAsRead(id, tenantId);
      res.json(message);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }
}

