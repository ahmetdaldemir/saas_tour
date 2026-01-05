import { Router } from 'express';
import { WalletController } from '../controllers/wallet.controller';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { authorize } from '../../auth/middleware/authorize.middleware';
import { Permission } from '../../auth/permissions';
import { AuthenticatedRequest } from '../../auth/middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get wallet
router.get('/:customerId', authorize(Permission.CUSTOMER_VIEW), (req, res, next) =>
  WalletController.getWallet(req as AuthenticatedRequest, res).catch(next)
);

// Get transactions
router.get('/:customerId/transactions', authorize(Permission.CUSTOMER_VIEW), (req, res, next) =>
  WalletController.getTransactions(req as AuthenticatedRequest, res).catch(next)
);

// Credit points (admin)
router.post('/:customerId/credit', authorize(Permission.CUSTOMER_UPDATE), (req, res, next) =>
  WalletController.creditPoints(req as AuthenticatedRequest, res).catch(next)
);

// Debit points (admin)
router.post('/:customerId/debit', authorize(Permission.CUSTOMER_UPDATE), (req, res, next) =>
  WalletController.debitPoints(req as AuthenticatedRequest, res).catch(next)
);

export default router;

