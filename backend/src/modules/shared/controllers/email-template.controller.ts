import { Request, Response } from 'express';
import { EmailTemplateService } from '../services/email-template.service';
import { EmailTemplateType } from '../entities/email-template.entity';
import { AuthenticatedRequest } from '../../auth/middleware/auth.middleware';

export class EmailTemplateController {
  static async list(req: Request, res: Response) {
    try {
      // Get tenantId from query parameter (no authentication required)
      const tenantId = req.query.tenantId as string | undefined;
      const languageId = req.query.languageId as string | undefined;

      if (!tenantId) {
        return res.status(400).json({ message: 'tenantId is required' });
      }

      const templates = await EmailTemplateService.list(tenantId, languageId);
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async getById(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const template = await EmailTemplateService.getById(id);

      if (!template) {
        return res.status(404).json({ message: 'Email template not found' });
      }

      res.json(template);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async getByType(req: Request, res: Response) {
    try {
      // Get tenantId from query parameter (no authentication required)
      const tenantId = req.query.tenantId as string | undefined;
      const type = req.query.type as EmailTemplateType;
      const languageId = req.query.languageId as string | undefined;

      if (!tenantId || !type) {
        return res.status(400).json({ message: 'tenantId and type query params are required' });
      }

      if (!Object.values(EmailTemplateType).includes(type)) {
        return res.status(400).json({ message: 'Invalid template type' });
      }

      const template = await EmailTemplateService.getByType(tenantId, type, languageId);
      res.json(template);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      // Get tenantId from authenticated user's token (security: prevent tenant spoofing)
      const tenantId = req.auth?.tenantId;
      const { languageId, type, name, subject, body, isActive, description } = req.body;

      if (!tenantId || !type || !name || !subject || !body) {
        return res.status(400).json({ message: 'Authentication required, type, name, subject, and body are required' });
      }

      if (!Object.values(EmailTemplateType).includes(type)) {
        return res.status(400).json({ message: 'Invalid template type' });
      }

      const template = await EmailTemplateService.create({
        tenantId, // Always use authenticated user's tenantId
        languageId,
        type,
        name,
        subject,
        body,
        isActive,
        description,
      });

      res.status(201).json(template);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async update(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body as any;

      if (updateData?.type && !Object.values(EmailTemplateType).includes(updateData.type)) {
        return res.status(400).json({ message: 'Invalid template type' });
      }

      const template = await EmailTemplateService.update(id, updateData);
      res.json(template);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      await EmailTemplateService.delete(id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }
}

