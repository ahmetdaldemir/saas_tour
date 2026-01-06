import { Response } from 'express';
import { WalletService, CreditPointsInput, DebitPointsInput } from '../services/wallet.service';
import { AuthenticatedRequest } from '../../auth/middleware/auth.middleware';
import { WalletTransactionSource } from '../entities/wallet-transaction.entity';

export class WalletController {
  /**
   * Get customer wallet
   * GET /wallet/:customerId
   */
  static async getWallet(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { customerId } = req.params;
      const wallet = await WalletService.getWallet(tenantId, customerId);

      if (!wallet) {
        return res.status(404).json({ message: 'Wallet not found' });
      }

      res.json({ success: true, data: wallet });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  /**
   * Get wallet transactions
   * GET /wallet/:customerId/transactions
   */
  static async getTransactions(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { customerId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      const result = await WalletService.getTransactions(tenantId, customerId, limit, offset);

      res.json({
        success: true,
        data: result.transactions,
        total: result.total,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  /**
   * Credit points to wallet (admin)
   * POST /wallet/:customerId/credit
   */
  static async creditPoints(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId;
      const userId = req.auth?.sub;
      if (!tenantId || !userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { customerId } = req.params;
      const { amount, description, source } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ message: 'Invalid amount' });
      }

      const input: CreditPointsInput = {
        tenantId,
        customerId,
        amount: parseFloat(amount),
        source: source || WalletTransactionSource.ADMIN_ADJUSTMENT,
        description,
        adminUserId: userId,
      };

      const transaction = await WalletService.creditPoints(input);

      res.json({ success: true, data: transaction });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  /**
   * Debit points from wallet (admin)
   * POST /wallet/:customerId/debit
   */
  static async debitPoints(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId;
      const userId = req.auth?.sub;
      if (!tenantId || !userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { customerId } = req.params;
      const { amount, reason } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ message: 'Invalid amount' });
      }

      if (!reason) {
        return res.status(400).json({ message: 'Reason is required' });
      }

      const input: DebitPointsInput = {
        tenantId,
        customerId,
        amount: parseFloat(amount),
        reason,
        adminUserId: userId,
      };

      const transaction = await WalletService.debitPoints(input);

      res.json({ success: true, data: transaction });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  /**
   * Adjust wallet (credit or debit) - unified endpoint
   * POST /wallet/customers/:customerId/adjust
   */
  static async adjustWallet(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId;
      const userId = req.auth?.sub;
      if (!tenantId || !userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { customerId } = req.params;
      const { type, amount, reason, description } = req.body;

      if (!type || !['credit', 'debit'].includes(type)) {
        return res.status(400).json({ message: 'Invalid type. Must be "credit" or "debit"' });
      }

      if (!amount || amount <= 0) {
        return res.status(400).json({ message: 'Invalid amount' });
      }

      if (!reason) {
        return res.status(400).json({ message: 'Reason is required' });
      }

      let transaction;
      if (type === 'credit') {
        const input: CreditPointsInput = {
          tenantId,
          customerId,
          amount: parseFloat(amount),
          source: WalletTransactionSource.ADMIN_ADJUSTMENT,
          description,
          adminUserId: userId,
        };
        transaction = await WalletService.creditPoints(input);
      } else {
        const input: DebitPointsInput = {
          tenantId,
          customerId,
          amount: parseFloat(amount),
          reason,
          adminUserId: userId,
        };
        transaction = await WalletService.debitPoints(input);
      }

      res.json({ success: true, data: transaction });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }
}

