import { Request, Response } from 'express';
import { EmailTemplateService } from '../services/email-template.service';
import { EmailTemplateType } from '../entities/email-template.entity';

export class EmailTemplateController {
  static async list(req: Request, res: Response) {
    try {
      const tenantId = req.query.tenantId as string;
      const languageId = req.query.languageId as string | undefined;

      if (!tenantId) {
        return res.status(400).json({ message: 'tenantId query param required' });
      }

      const templates = await EmailTemplateService.list(tenantId, languageId);
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async getById(req: Request, res: Response) {
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
      const tenantId = req.query.tenantId as string;
      const type = req.query.type as EmailTemplateType;
      const languageId = req.query.languageId as string | undefined;

      if (!tenantId || !type) {
        return res.status(400).json({ message: 'tenantId and type query params required' });
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

  static async create(req: Request, res: Response) {
    try {
      const { tenantId, languageId, type, name, subject, body, isActive, description } = req.body;

      if (!tenantId || !type || !name || !subject || !body) {
        return res.status(400).json({ message: 'tenantId, type, name, subject, and body are required' });
      }

      if (!Object.values(EmailTemplateType).includes(type)) {
        return res.status(400).json({ message: 'Invalid template type' });
      }

      const template = await EmailTemplateService.create({
        tenantId,
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

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (updateData.type && !Object.values(EmailTemplateType).includes(updateData.type)) {
        return res.status(400).json({ message: 'Invalid template type' });
      }

      const template = await EmailTemplateService.update(id, updateData);
      res.json(template);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await EmailTemplateService.delete(id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }
}

