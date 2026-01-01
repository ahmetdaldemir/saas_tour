import { Response } from 'express';
import { AuthenticatedRequest } from '../../auth/middleware/auth.middleware';
import { asyncHandler } from '../../../utils/errors';
import { FinanceCategoryService } from '../services/finance-category.service';
import { FinanceCategoryType } from '../entities/finance-category.entity';

export class FinanceCategoryController {
  static list = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const tenantId = req.auth?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const type = req.query.type as FinanceCategoryType | undefined;
    const parentId = req.query.parentId === 'null' ? null : (req.query.parentId as string | undefined);

    const categories = await FinanceCategoryService.list(tenantId, type, parentId);
    res.json(categories);
  });

  static getById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const tenantId = req.auth?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const category = await FinanceCategoryService.getById(id, tenantId);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json(category);
  });

  static create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const tenantId = req.auth?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const category = await FinanceCategoryService.create({
      ...req.body,
      tenantId,
    });
    res.status(201).json(category);
  });

  static update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const tenantId = req.auth?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const category = await FinanceCategoryService.update(id, tenantId, req.body);
    res.json(category);
  });

  static remove = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const tenantId = req.auth?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    await FinanceCategoryService.remove(id, tenantId);
    res.status(204).send();
  });
}

