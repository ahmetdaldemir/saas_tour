import { Response } from 'express';
import { AuthenticatedRequest } from '../../auth/middleware/auth.middleware';
import { asyncHandler } from '../../../utils/errors';
import { FinanceTransactionService } from '../services/finance-transaction.service';
import { FinanceTransactionType, FinanceTransactionStatus } from '../entities/finance-transaction.entity';

export class FinanceTransactionController {
  static list = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const tenantId = req.auth?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const filters: any = {};
    if (req.query.type) filters.type = req.query.type as FinanceTransactionType;
    if (req.query.from) filters.from = new Date(req.query.from as string);
    if (req.query.to) filters.to = new Date(req.query.to as string);
    if (req.query.categoryId) filters.categoryId = req.query.categoryId as string;
    if (req.query.cariId) filters.cariId = req.query.cariId as string;
    if (req.query.status) filters.status = req.query.status as FinanceTransactionStatus;

    const transactions = await FinanceTransactionService.list(tenantId, filters);
    res.json(transactions);
  });

  static getById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const tenantId = req.auth?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const transaction = await FinanceTransactionService.getById(id, tenantId);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json(transaction);
  });

  static create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const tenantId = req.auth?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const transaction = await FinanceTransactionService.create({
      ...req.body,
      tenantId,
    });
    res.status(201).json(transaction);
  });

  static update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const tenantId = req.auth?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const transaction = await FinanceTransactionService.update(id, tenantId, req.body);
    res.json(transaction);
  });

  static remove = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const tenantId = req.auth?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    await FinanceTransactionService.remove(id, tenantId);
    res.status(204).send();
  });
}

