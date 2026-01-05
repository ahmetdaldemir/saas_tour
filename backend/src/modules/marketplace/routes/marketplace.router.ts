import { Router } from 'express';
import { MarketplaceController } from '../controllers/marketplace.controller';
import { AuthenticatedRequest } from '../../auth/middleware/auth.middleware';
import { authenticate } from '../../auth/middleware/auth.middleware';
import { authorize } from '../../auth/middleware/authorize.middleware';
import { Permission } from '../../auth/permissions';

const router = Router();

// Listing routes
router.post('/listings', authenticate, authorize(Permission.RESERVATION_UPDATE), (req, res, next) => MarketplaceController.createListing(req as AuthenticatedRequest, res).catch(next));
router.get('/listings', authenticate, authorize(Permission.RESERVATION_VIEW), (req, res, next) => MarketplaceController.listListings(req as AuthenticatedRequest, res).catch(next));
router.get('/listings/:id', authenticate, authorize(Permission.RESERVATION_VIEW), (req, res, next) => MarketplaceController.getListing(req as AuthenticatedRequest, res).catch(next));
router.put('/listings/:id', authenticate, authorize(Permission.RESERVATION_UPDATE), (req, res, next) => MarketplaceController.updateListing(req as AuthenticatedRequest, res).catch(next));
router.delete('/listings/:id', authenticate, authorize(Permission.RESERVATION_UPDATE), (req, res, next) => MarketplaceController.deleteListing(req as AuthenticatedRequest, res).catch(next));
router.post('/listings/:id/approve', authenticate, authorize(Permission.RESERVATION_UPDATE), (req, res, next) => MarketplaceController.approveListing(req as AuthenticatedRequest, res).catch(next));

// Agreement routes
router.post('/agreements', authenticate, authorize(Permission.RESERVATION_UPDATE), (req, res, next) => MarketplaceController.createAgreement(req as AuthenticatedRequest, res).catch(next));
router.get('/agreements', authenticate, authorize(Permission.RESERVATION_VIEW), (req, res, next) => MarketplaceController.listAgreements(req as AuthenticatedRequest, res).catch(next));
router.get('/agreements/:id', authenticate, authorize(Permission.RESERVATION_VIEW), (req, res, next) => MarketplaceController.getAgreement(req as AuthenticatedRequest, res).catch(next));
router.post('/agreements/:id/approve', authenticate, authorize(Permission.RESERVATION_UPDATE), (req, res, next) => MarketplaceController.approveAgreement(req as AuthenticatedRequest, res).catch(next));
router.post('/agreements/:id/suspend', authenticate, authorize(Permission.RESERVATION_UPDATE), (req, res, next) => MarketplaceController.suspendAgreement(req as AuthenticatedRequest, res).catch(next));
router.post('/agreements/:id/terminate', authenticate, authorize(Permission.RESERVATION_UPDATE), (req, res, next) => MarketplaceController.terminateAgreement(req as AuthenticatedRequest, res).catch(next));

// Commission routes
router.post('/commission/calculate', authenticate, authorize(Permission.RESERVATION_VIEW), (req, res, next) => MarketplaceController.calculateCommission(req as AuthenticatedRequest, res).catch(next));
router.post('/commission/transactions', authenticate, authorize(Permission.RESERVATION_UPDATE), (req, res, next) => MarketplaceController.createTransaction(req as AuthenticatedRequest, res).catch(next));
router.get('/commission/transactions', authenticate, authorize(Permission.RESERVATION_VIEW), (req, res, next) => MarketplaceController.listTransactions(req as AuthenticatedRequest, res).catch(next));
router.get('/commission/summary', authenticate, authorize(Permission.RESERVATION_VIEW), (req, res, next) => MarketplaceController.getCommissionSummary(req as AuthenticatedRequest, res).catch(next));

export default router;

