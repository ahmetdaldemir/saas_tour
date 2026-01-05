import { Response } from 'express';
import { CouponService, CreateCouponInput, ValidateCouponInput, RedeemCouponInput } from '../services/coupon.service';
import { AuthenticatedRequest } from '../../auth/middleware/auth.middleware';

export class CouponController {
  /**
   * List coupons (admin)
   * GET /coupons
   */
  static async list(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { status, customerId, isUsed } = req.query;
      const coupons = await CouponService.listCoupons(tenantId, {
        status: status as any,
        customerId: customerId as string,
        isUsed: isUsed === 'true' ? true : isUsed === 'false' ? false : undefined,
      });

      res.json({ success: true, data: coupons });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  /**
   * Create coupon from ParaPuan (admin)
   * POST /coupons
   */
  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId;
      const userId = req.auth?.sub;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const input: CreateCouponInput = {
        tenantId,
        customerId: req.body.customerId,
        value: parseFloat(req.body.value),
        currencyCode: req.body.currencyCode || 'TRY',
        expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : undefined,
        isSingleUse: req.body.isSingleUse !== false,
        description: req.body.description,
        createdByUserId: userId,
      };

      if (!input.value || input.value <= 0) {
        return res.status(400).json({ message: 'Invalid coupon value' });
      }

      const coupon = await CouponService.createCouponFromPoints(input);

      res.status(201).json({ success: true, data: coupon });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  /**
   * Validate coupon code (public)
   * POST /coupons/validate
   */
  static async validate(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId || req.body.tenantId;
      if (!tenantId) {
        return res.status(400).json({ message: 'tenantId is required' });
      }

      const input: ValidateCouponInput = {
        tenantId,
        code: req.body.code,
        customerId: req.body.customerId,
        reservationTotal: req.body.reservationTotal ? parseFloat(req.body.reservationTotal) : undefined,
      };

      if (!input.code) {
        return res.status(400).json({ message: 'Coupon code is required' });
      }

      const result = await CouponService.validateCoupon(input);

      if (!result.valid) {
        return res.status(400).json({
          success: false,
          valid: false,
          error: result.error,
        });
      }

      res.json({
        success: true,
        valid: true,
        data: {
          coupon: result.coupon,
          discountAmount: result.discountAmount,
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
   * Redeem coupon (public, during reservation finalization)
   * POST /coupons/redeem
   */
  static async redeem(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId || req.body.tenantId;
      if (!tenantId) {
        return res.status(400).json({ message: 'tenantId is required' });
      }

      const input: RedeemCouponInput = {
        tenantId,
        code: req.body.code,
        reservationId: req.body.reservationId,
        reservationTotal: parseFloat(req.body.reservationTotal),
        customerId: req.body.customerId,
        ipAddress: req.ip || req.headers['x-forwarded-for'] as string || undefined,
        userAgent: req.headers['user-agent'] || undefined,
      };

      if (!input.code) {
        return res.status(400).json({ message: 'Coupon code is required' });
      }

      if (!input.reservationId) {
        return res.status(400).json({ message: 'reservationId is required' });
      }

      if (!input.reservationTotal || input.reservationTotal <= 0) {
        return res.status(400).json({ message: 'Invalid reservation total' });
      }

      const result = await CouponService.redeemCoupon(input);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
        });
      }

      res.json({
        success: true,
        data: {
          coupon: result.coupon,
          discountAmount: result.discountAmount,
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
   * Get coupon by code (admin)
   * GET /coupons/:code
   */
  static async getByCode(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { code } = req.params;
      const coupon = await CouponService.getCouponByCode(tenantId, code);

      if (!coupon) {
        return res.status(404).json({ message: 'Coupon not found' });
      }

      res.json({ success: true, data: coupon });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }
}

