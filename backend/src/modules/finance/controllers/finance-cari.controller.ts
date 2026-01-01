import { Response } from 'express';
import { AuthenticatedRequest } from '../../auth/middleware/auth.middleware';
import { asyncHandler } from '../../../utils/errors';
import { FinanceCariService } from '../services/finance-cari.service';

export class FinanceCariController {
  static list = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const tenantId = req.auth?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const search = req.query.search as string | undefined;
    const cariler = await FinanceCariService.list(tenantId, search);
    res.json(cariler);
  });

  static getById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const tenantId = req.auth?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const cari = await FinanceCariService.getById(id, tenantId);
    if (!cari) {
      return res.status(404).json({ message: 'Cari not found' });
    }

    res.json(cari);
  });

  static create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const tenantId = req.auth?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const cari = await FinanceCariService.create({
      ...req.body,
      tenantId,
    });
    res.status(201).json(cari);
  });

  static update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const tenantId = req.auth?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const cari = await FinanceCariService.update(id, tenantId, req.body);
    res.json(cari);
  });

  static remove = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const tenantId = req.auth?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    await FinanceCariService.remove(id, tenantId);
    res.status(204).send();
  });
}

