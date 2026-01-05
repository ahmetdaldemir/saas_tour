import { Response } from 'express';
import { AuthenticatedRequest, TenantRequest } from '../../../middleware/auth.middleware';
import { StaffPerformanceService } from '../services/staff-performance.service';

export class StaffPerformanceController {
  /**
   * Get staff scores for current user
   */
  static async getMyScores(req: AuthenticatedRequest & TenantRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId || req.tenant?.id;
      const userId = req.auth?.sub;

      if (!tenantId || !userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const periodType = (req.query.periodType as 'monthly' | 'weekly' | 'daily') || 'monthly';
      const limit = parseInt(req.query.limit as string) || 12;

      const scores = await StaffPerformanceService.getUserScores(userId, tenantId, periodType, limit);

      res.json({ scores });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  /**
   * Get all staff scores for tenant (admin only)
   */
  static async getTenantScores(req: AuthenticatedRequest & TenantRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId || req.tenant?.id;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const period = req.query.period as string;
      const periodType = (req.query.periodType as 'monthly' | 'weekly' | 'daily') || 'monthly';

      if (!period) {
        // Default to current month
        const now = new Date();
        const defaultPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const scores = await StaffPerformanceService.getTenantScores(tenantId, defaultPeriod, periodType);
        return res.json({ scores, period: defaultPeriod });
      }

      const scores = await StaffPerformanceService.getTenantScores(tenantId, period, periodType);
      res.json({ scores, period });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  /**
   * Calculate/Recalculate scores for a period
   */
  static async recalculateScores(req: AuthenticatedRequest & TenantRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId || req.tenant?.id;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { period, periodType = 'monthly' } = req.body;

      if (!period) {
        return res.status(400).json({ message: 'Period is required' });
      }

      await StaffPerformanceService.recalculatePeriod(
        tenantId,
        period,
        periodType as 'monthly' | 'weekly' | 'daily'
      );

      res.json({ success: true, message: 'Scores recalculated' });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  /**
   * Get score details for a specific user and period
   */
  static async getUserScoreDetails(req: AuthenticatedRequest & TenantRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId || req.tenant?.id;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { userId } = req.params;
      const period = req.query.period as string;
      const periodType = (req.query.periodType as 'monthly' | 'weekly' | 'daily') || 'monthly';

      if (!period) {
        return res.status(400).json({ message: 'Period is required' });
      }

      const result = await StaffPerformanceService.calculateScore(
        userId,
        tenantId,
        period,
        periodType
      );

      res.json(result);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }
}

