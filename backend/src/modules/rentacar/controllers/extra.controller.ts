import { Request, Response } from 'express';
import { ExtraService } from '../services/extra.service';
import { asyncHandler } from '../../../utils/errors';

export class ExtraController {
  static list = asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.query.tenantId as string;
    if (!tenantId) {
      return res.status(400).json({ message: 'tenantId query param required' });
    }

    const extras = await ExtraService.list(tenantId);
    res.json(extras);
  });

  static getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const tenantId = req.query.tenantId as string;

    if (!tenantId) {
      return res.status(400).json({ message: 'tenantId query param required' });
    }

    const extra = await ExtraService.getById(id, tenantId);
    if (!extra) {
      return res.status(404).json({ message: 'Extra not found' });
    }

    res.json(extra);
  });

  static create = asyncHandler(async (req: Request, res: Response) => {
    const extra = await ExtraService.create(req.body);
    res.status(201).json(extra);
  });

  static update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const tenantId = req.body.tenantId || req.query.tenantId as string;

    if (!tenantId) {
      return res.status(400).json({ message: 'tenantId is required' });
    }

    const extra = await ExtraService.update(id, tenantId, req.body);
    res.json(extra);
  });

  static remove = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const tenantId = req.query.tenantId as string;

    if (!tenantId) {
      return res.status(400).json({ message: 'tenantId query param required' });
    }

    await ExtraService.remove(id, tenantId);
    res.status(204).send();
  });
}

