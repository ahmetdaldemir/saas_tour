import { Response } from 'express';
import { AuthenticatedRequest } from '../../auth/middleware/auth.middleware';
import { asyncHandler } from '../../../utils/errors';
import { FinanceLoanInstallmentService } from '../services/finance-loan-installment.service';

export class FinanceLoanInstallmentController {
  static list = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const tenantId = req.auth?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const loanId = req.query.loanId as string | undefined;
    const installments = await FinanceLoanInstallmentService.list(tenantId, loanId);
    res.json(installments);
  });

  static getById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const tenantId = req.auth?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const installment = await FinanceLoanInstallmentService.getById(id, tenantId);
    if (!installment) {
      return res.status(404).json({ message: 'Installment not found' });
    }

    res.json(installment);
  });

  static pay = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { paidAmount, paymentMethod } = req.body;
    const tenantId = req.auth?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!paidAmount || paidAmount <= 0) {
      return res.status(400).json({ message: 'paidAmount is required and must be greater than 0' });
    }

    const installment = await FinanceLoanInstallmentService.pay(id, tenantId, Number(paidAmount), paymentMethod);
    res.json(installment);
  });

  static cancel = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const tenantId = req.auth?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const installment = await FinanceLoanInstallmentService.cancel(id, tenantId);
    res.json(installment);
  });
}

