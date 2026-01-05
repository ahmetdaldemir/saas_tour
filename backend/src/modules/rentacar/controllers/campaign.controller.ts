import { Response } from 'express';
import { CampaignService, CreateCampaignInput, UpdateCampaignInput } from '../services/campaign.service';
import { AuthenticatedRequest } from '../../auth/middleware/auth.middleware';

export class CampaignController {
  /**
   * List all campaigns for tenant
   * GET /rentacar/campaigns
   */
  static async list(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;
      const campaigns = await CampaignService.list(tenantId, { isActive });
      res.json({ success: true, data: campaigns });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  /**
   * Get campaign by ID
   * GET /rentacar/campaigns/:id
   */
  static async getById(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { id } = req.params;
      const campaign = await CampaignService.getById(id, tenantId);

      if (!campaign) {
        return res.status(404).json({ message: 'Campaign not found' });
      }

      res.json({ success: true, data: campaign });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  /**
   * Create new campaign
   * POST /rentacar/campaigns
   */
  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const input: CreateCampaignInput = {
        ...req.body,
        tenantId,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
      };

      const campaign = await CampaignService.create(input);
      res.status(201).json({ success: true, data: campaign });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  /**
   * Update campaign
   * PUT /rentacar/campaigns/:id
   */
  static async update(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { id } = req.params;
      const input: UpdateCampaignInput = { ...req.body };

      // Convert date strings to Date objects if provided
      if (input.startDate) {
        input.startDate = new Date(input.startDate as any);
      }
      if (input.endDate) {
        input.endDate = new Date(input.endDate as any);
      }

      const campaign = await CampaignService.update(id, tenantId, input);
      res.json({ success: true, data: campaign });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  /**
   * Delete campaign
   * DELETE /rentacar/campaigns/:id
   */
  static async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { id } = req.params;
      await CampaignService.delete(id, tenantId);
      res.json({ success: true, message: 'Campaign deleted' });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  /**
   * Get applicable campaigns for a quote
   * POST /rentacar/campaigns/check-applicable
   */
  static async checkApplicable(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { pickupLocationId, vehicleId, vehicleCategoryId, rentalDays, pickupDate, basePrice } = req.body;

      if (!pickupLocationId || !vehicleId || !rentalDays || !pickupDate) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: pickupLocationId, vehicleId, rentalDays, pickupDate',
        });
      }

      const { CampaignService } = await import('../services/campaign.service');
      const applicableCampaigns = await CampaignService.findApplicableCampaigns({
        tenantId,
        pickupLocationId,
        vehicleId,
        vehicleCategoryId: vehicleCategoryId || null,
        rentalDays,
        pickupDate: new Date(pickupDate),
      });

      // If basePrice is provided, calculate discount
      let discountResult = null;
      if (basePrice !== undefined) {
        const bestCampaign = CampaignService.selectBestCampaign(applicableCampaigns);
        if (bestCampaign) {
          const { discountAmount, finalPrice } = CampaignService.calculateDiscount(basePrice, bestCampaign);
          discountResult = {
            campaignId: bestCampaign.id,
            campaignName: bestCampaign.name,
            discountType: bestCampaign.discountType,
            discountPercent: bestCampaign.discountPercent || 0,
            discountAmount,
            finalPrice,
          };
        }
      }

      res.json({
        success: true,
        data: {
          applicableCampaigns,
          bestCampaign: applicableCampaigns.length > 0 ? CampaignService.selectBestCampaign(applicableCampaigns) : null,
          discount: discountResult,
        },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  /**
   * Get quote with campaign discount breakdown
   * POST /rentacar/campaigns/quote
   */
  static async getQuote(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { pickupLocationId, vehicleId, vehicleCategoryId, rentalDays, pickupDate, basePrice } = req.body;

      if (!pickupLocationId || !vehicleId || !rentalDays || !pickupDate || basePrice === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: pickupLocationId, vehicleId, rentalDays, pickupDate, basePrice',
        });
      }

      const { CampaignService } = await import('../services/campaign.service');
      const discountResult = await CampaignService.getCampaignDiscount(
        {
          tenantId,
          pickupLocationId,
          vehicleId,
          vehicleCategoryId: vehicleCategoryId || null,
          rentalDays,
          pickupDate: new Date(pickupDate),
        },
        basePrice
      );

      res.json({
        success: true,
        data: {
          basePrice,
          campaignDiscount: discountResult,
          finalPrice: discountResult ? discountResult.finalPrice : basePrice,
        },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }
}

