import { Response } from 'express';
import { VehicleTimelineService } from '../services/vehicle-timeline.service';
import { AuthenticatedRequest } from '../../auth/middleware/auth.middleware';

export class VehicleTimelineController {
  /**
   * Get timeline for a vehicle
   * GET /rentacar/vehicles/:id/timeline
   */
  static async getTimeline(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { id: vehicleId } = req.params;

      const timeline = await VehicleTimelineService.getTimeline(vehicleId, tenantId);

      res.json({
        success: true,
        data: timeline,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }
}

