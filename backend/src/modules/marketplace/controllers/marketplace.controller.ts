import { Response } from 'express';
import { MarketplaceService, CreateListingInput, CreateAgreementInput } from '../services/marketplace.service';
import { CommissionService } from '../services/commission.service';
import { ServiceType, ListingStatus } from '../entities/marketplace-listing.entity';
import { AgreementStatus } from '../entities/tenant-service-agreement.entity';
import { TransactionStatus, TransactionType } from '../entities/commission-transaction.entity';
import { AuthenticatedRequest } from '../../auth/middleware/auth.middleware';

export class MarketplaceController {
  /**
   * Create listing
   * POST /marketplace/listings
   */
  static async createListing(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const listing = await MarketplaceService.createListing({
        ...req.body,
        tenantId,
      });

      res.status(201).json({ success: true, data: listing });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  /**
   * List listings
   * GET /marketplace/listings
   */
  static async listListings(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId;
      const filters: any = {};
      
      // Only show own listings or active listings from others
      if (req.query.myListings === 'true' && tenantId) {
        filters.tenantId = tenantId;
      } else {
        filters.status = ListingStatus.ACTIVE;
      }
      
      if (req.query.serviceType) {
        filters.serviceType = req.query.serviceType as ServiceType;
      }
      if (req.query.isAvailable !== undefined) {
        filters.isAvailable = req.query.isAvailable === 'true';
      }

      const listings = await MarketplaceService.listListings(filters);

      res.json({ success: true, data: listings });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  /**
   * Get listing by ID
   * GET /marketplace/listings/:id
   */
  static async getListing(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const listing = await MarketplaceService.getListing(id);

      if (!listing) {
        return res.status(404).json({ message: 'Listing not found' });
      }

      res.json({ success: true, data: listing });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  /**
   * Update listing
   * PUT /marketplace/listings/:id
   */
  static async updateListing(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { id } = req.params;
      const listing = await MarketplaceService.updateListing(id, tenantId, req.body);

      res.json({ success: true, data: listing });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  /**
   * Delete listing
   * DELETE /marketplace/listings/:id
   */
  static async deleteListing(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { id } = req.params;
      await MarketplaceService.deleteListing(id, tenantId);

      res.json({ success: true, message: 'Listing deleted' });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  /**
   * Approve listing
   * POST /marketplace/listings/:id/approve
   */
  static async approveListing(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { id } = req.params;
      const listing = await MarketplaceService.approveListing(id, tenantId);

      res.json({ success: true, data: listing });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  /**
   * Create agreement
   * POST /marketplace/agreements
   */
  static async createAgreement(req: AuthenticatedRequest, res: Response) {
    try {
      const consumerTenantId = req.auth?.tenantId;
      if (!consumerTenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const agreement = await MarketplaceService.createAgreement({
        ...req.body,
        consumerTenantId,
      });

      res.status(201).json({ success: true, data: agreement });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  /**
   * List agreements
   * GET /marketplace/agreements
   */
  static async listAgreements(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const filters: any = {};
      if (req.query.asProvider === 'true') {
        filters.providerTenantId = tenantId;
      } else if (req.query.asConsumer === 'true') {
        filters.consumerTenantId = tenantId;
      } else {
        // Show both
        filters.providerTenantId = tenantId;
        filters.consumerTenantId = tenantId;
      }
      
      if (req.query.status) {
        filters.status = req.query.status as AgreementStatus;
      }

      const agreements = await MarketplaceService.listAgreements(filters);

      res.json({ success: true, data: agreements });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  /**
   * Get agreement by ID
   * GET /marketplace/agreements/:id
   */
  static async getAgreement(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const agreement = await MarketplaceService.getAgreement(id);

      if (!agreement) {
        return res.status(404).json({ message: 'Agreement not found' });
      }

      res.json({ success: true, data: agreement });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  /**
   * Approve agreement
   * POST /marketplace/agreements/:id/approve
   */
  static async approveAgreement(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { id } = req.params;
      const isProvider = req.body.isProvider === true;
      const agreement = await MarketplaceService.approveAgreement(id, tenantId, isProvider);

      res.json({ success: true, data: agreement });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  /**
   * Suspend agreement
   * POST /marketplace/agreements/:id/suspend
   */
  static async suspendAgreement(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { id } = req.params;
      const agreement = await MarketplaceService.suspendAgreement(id, tenantId);

      res.json({ success: true, data: agreement });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  /**
   * Terminate agreement
   * POST /marketplace/agreements/:id/terminate
   */
  static async terminateAgreement(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { id } = req.params;
      const agreement = await MarketplaceService.terminateAgreement(id, tenantId);

      res.json({ success: true, data: agreement });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  /**
   * Calculate commission
   * POST /marketplace/commission/calculate
   */
  static async calculateCommission(req: AuthenticatedRequest, res: Response) {
    try {
      const { agreementId, transactionAmount } = req.body;

      const { MarketplaceService } = await import('../services/marketplace.service');
      const agreement = await MarketplaceService.getAgreement(agreementId);

      if (!agreement) {
        return res.status(404).json({ message: 'Agreement not found' });
      }

      const result = CommissionService.calculateCommission(agreement, transactionAmount);

      res.json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  /**
   * Create commission transaction
   * POST /marketplace/commission/transactions
   */
  static async createTransaction(req: AuthenticatedRequest, res: Response) {
    try {
      const transaction = await CommissionService.createTransaction(req.body);

      res.status(201).json({ success: true, data: transaction });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  /**
   * List transactions
   * GET /marketplace/commission/transactions
   */
  static async listTransactions(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const filters: any = {};
      if (req.query.asProvider === 'true') {
        filters.providerTenantId = tenantId;
      } else if (req.query.asConsumer === 'true') {
        filters.consumerTenantId = tenantId;
      }
      
      if (req.query.agreementId) {
        filters.agreementId = req.query.agreementId as string;
      }
      if (req.query.status) {
        filters.status = req.query.status as TransactionStatus;
      }
      if (req.query.type) {
        filters.type = req.query.type as TransactionType;
      }
      if (req.query.fromDate) {
        filters.fromDate = new Date(req.query.fromDate as string);
      }
      if (req.query.toDate) {
        filters.toDate = new Date(req.query.toDate as string);
      }

      const transactions = await CommissionService.listTransactions(filters);

      res.json({ success: true, data: transactions });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  /**
   * Get commission summary
   * GET /marketplace/commission/summary
   */
  static async getCommissionSummary(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const asProvider = req.query.asProvider === 'true';
      const summary = await CommissionService.getCommissionSummary(tenantId, asProvider);

      res.json({ success: true, data: summary });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }
}

