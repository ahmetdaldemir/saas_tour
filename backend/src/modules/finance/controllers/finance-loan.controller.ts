import { Response } from 'express';
import { AuthenticatedRequest } from '../../auth/middleware/auth.middleware';
import { asyncHandler } from '../../../utils/errors';
import { FinanceLoanService } from '../services/finance-loan.service';
import { FinanceLoanStatus } from '../entities/finance-loan.entity';

export class FinanceLoanController {
  static list = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const tenantId = req.auth?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const status = req.query.status as FinanceLoanStatus | undefined;
    const loans = await FinanceLoanService.list(tenantId, status);
    res.json(loans);
  });

  static getById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const tenantId = req.auth?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const includeInstallments = req.query.includeInstallments === 'true';
    const loan = await FinanceLoanService.getById(id, tenantId, includeInstallments);
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    res.json(loan);
  });

  static create = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const tenantId = req.auth?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const loan = await FinanceLoanService.create({
      ...req.body,
      tenantId,
    });
    res.status(201).json(loan);
  });

  static update = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const tenantId = req.auth?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const loan = await FinanceLoanService.update(id, tenantId, req.body);
    res.json(loan);
  });

  static close = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const tenantId = req.auth?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const loan = await FinanceLoanService.close(id, tenantId);
    res.json(loan);
  });

  static regenerateInstallments = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const tenantId = req.auth?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const loan = await FinanceLoanService.getById(id, tenantId);
    if (!loan) {
      return res.status(404).json({ message: 'Loan not found' });
    }

    const installments = await FinanceLoanService.generateInstallments(id, tenantId, loan);
    res.json({ message: 'Installments regenerated', installments });
  });

  static remove = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const tenantId = req.auth?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    await FinanceLoanService.remove(id, tenantId);
    res.status(204).send();
  });
}

