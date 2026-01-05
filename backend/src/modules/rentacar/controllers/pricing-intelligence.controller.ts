import { Response } from 'express';
import { PricingIntelligenceService } from '../services/pricing-intelligence.service';
import { InsightType, InsightSeverity, InsightStatus } from '../entities/pricing-insight.entity';
import { AuthenticatedRequest } from '../../auth/middleware/auth.middleware';

export class PricingIntelligenceController {
  /**
   * Analyze tenant and generate insights
   * POST /rentacar/pricing-intelligence/analyze
   */
  static async analyze(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const result = await PricingIntelligenceService.analyzeTenant(tenantId);

      res.json({
        success: true,
        message: 'Analysis completed',
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  /**
   * List insights
   * GET /rentacar/pricing-intelligence/insights
   */
  static async listInsights(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const filters: any = {};
      if (req.query.type) filters.type = req.query.type as InsightType;
      if (req.query.severity) filters.severity = req.query.severity as InsightSeverity;
      if (req.query.status) filters.status = req.query.status as InsightStatus;
      if (req.query.vehicleId) filters.vehicleId = req.query.vehicleId as string;

      const insights = await PricingIntelligenceService.listInsights(tenantId, filters);

      res.json({
        success: true,
        data: insights,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  /**
   * Get dashboard summary
   * GET /rentacar/pricing-intelligence/dashboard
   */
  static async getDashboard(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const insights = await PricingIntelligenceService.listInsights(tenantId, {
        status: InsightStatus.ACTIVE,
      });

      const summary = {
        total: insights.length,
        byType: {} as Record<InsightType, number>,
        bySeverity: {} as Record<InsightSeverity, number>,
        critical: insights.filter(i => i.severity === InsightSeverity.CRITICAL).length,
        warning: insights.filter(i => i.severity === InsightSeverity.WARNING).length,
        info: insights.filter(i => i.severity === InsightSeverity.INFO).length,
      };

      insights.forEach(insight => {
        summary.byType[insight.type] = (summary.byType[insight.type] || 0) + 1;
        summary.bySeverity[insight.severity] = (summary.bySeverity[insight.severity] || 0) + 1;
      });

      // Get top insights
      const topInsights = insights
        .sort((a, b) => {
          const severityOrder = { [InsightSeverity.CRITICAL]: 3, [InsightSeverity.WARNING]: 2, [InsightSeverity.INFO]: 1 };
          return severityOrder[b.severity] - severityOrder[a.severity];
        })
        .slice(0, 10);

      res.json({
        success: true,
        data: {
          summary,
          topInsights,
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
   * Acknowledge insight
   * POST /rentacar/pricing-intelligence/insights/:id/acknowledge
   */
  static async acknowledgeInsight(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { id } = req.params;
      const insight = await PricingIntelligenceService.acknowledgeInsight(id, tenantId, req.auth?.sub || tenantId);

      res.json({
        success: true,
        message: 'Insight acknowledged',
        data: insight,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  /**
   * Dismiss insight
   * POST /rentacar/pricing-intelligence/insights/:id/dismiss
   */
  static async dismissInsight(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { id } = req.params;
      const insight = await PricingIntelligenceService.dismissInsight(id, tenantId);

      res.json({
        success: true,
        message: 'Insight dismissed',
        data: insight,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  /**
   * Get default rule
   * GET /rentacar/pricing-intelligence/rules/default
   */
  static async getDefaultRule(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const rule = await PricingIntelligenceService.getDefaultRule(tenantId);

      res.json({
        success: true,
        data: rule,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }
}

