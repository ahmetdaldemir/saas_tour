import { Request, Response } from 'express';
import { OperationsService } from '../services/operations.service';
import { AuthenticatedRequest } from '../../auth/middleware/auth.middleware';
import { FileUploadController, upload } from '../../shared/controllers/file-upload.controller';
import multer from 'multer';

export class OperationsController {
  /**
   * GET /operations?date=YYYY-MM-DD
   * Get pickups and returns for a specific date
   */
  static async getOperations(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.auth) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const tenantId = req.auth.tenantId;
      const date = (req.query.date as string) || new Date().toISOString().split('T')[0];

      const result = await OperationsService.getOperationsByDate(tenantId, date);

      res.json(result);
    } catch (error) {
      console.error('Error getting operations:', error);
      res.status(500).json({ message: (error as Error).message });
    }
  }

  /**
   * GET /operations/pickup/:reservationId
   * Get pickup record (draft or completed)
   */
  static async getPickup(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.auth) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { reservationId } = req.params;
      const tenantId = req.auth.tenantId;

      const result = await OperationsService.getPickup(tenantId, reservationId);

      res.json(result);
    } catch (error) {
      console.error('Error getting pickup:', error);
      res.status(400).json({ message: (error as Error).message });
    }
  }

  /**
   * POST /operations/pickup/:reservationId/draft
   * Save pickup draft
   */
  static async savePickupDraft(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.auth) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { reservationId } = req.params;
      const tenantId = req.auth.tenantId;
      const userId = req.auth.sub || 'unknown';

      const { odometerKm, fuelLevel, photos } = req.body;

      const pickup = await OperationsService.savePickupDraft(
        tenantId,
        reservationId,
        userId,
        {
          odometerKm,
          fuelLevel,
          photos,
        }
      );

      res.json(pickup);
    } catch (error) {
      console.error('Error saving pickup draft:', error);
      res.status(400).json({ message: (error as Error).message });
    }
  }

  /**
   * POST /operations/pickup/:reservationId/complete
   * Complete pickup
   */
  static async completePickup(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.auth) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { reservationId } = req.params;
      const tenantId = req.auth.tenantId;
      const userId = req.auth.sub || 'unknown';

      const { odometerKm, fuelLevel, photos } = req.body;

      if (!odometerKm || !fuelLevel || !photos || photos.length !== 8) {
        return res.status(400).json({
          message: 'odometerKm, fuelLevel, and exactly 8 photos are required',
        });
      }

      const pickup = await OperationsService.completePickup(
        tenantId,
        reservationId,
        userId,
        {
          odometerKm: Number(odometerKm),
          fuelLevel,
          photos,
        }
      );

      res.json({
        success: true,
        pickup,
        message: 'Pickup completed successfully',
      });
    } catch (error) {
      console.error('Error completing pickup:', error);
      res.status(400).json({ message: (error as Error).message });
    }
  }

  /**
   * GET /operations/return/:reservationId
   * Get return record (draft or completed)
   */
  static async getReturn(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.auth) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { reservationId } = req.params;
      const tenantId = req.auth.tenantId;

      const result = await OperationsService.getReturn(tenantId, reservationId);

      res.json(result);
    } catch (error) {
      console.error('Error getting return:', error);
      res.status(400).json({ message: (error as Error).message });
    }
  }

  /**
   * POST /operations/return/:reservationId/draft
   * Save return draft
   */
  static async saveReturnDraft(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.auth) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { reservationId } = req.params;
      const tenantId = req.auth.tenantId;
      const userId = req.auth.sub || 'unknown';

      const { odometerKm, fuelLevel, photos } = req.body;

      const returnRecord = await OperationsService.saveReturnDraft(
        tenantId,
        reservationId,
        userId,
        {
          odometerKm,
          fuelLevel,
          photos,
        }
      );

      res.json(returnRecord);
    } catch (error) {
      console.error('Error saving return draft:', error);
      res.status(400).json({ message: (error as Error).message });
    }
  }

  /**
   * POST /operations/return/:reservationId/complete
   * Complete return with warnings check
   */
  static async completeReturn(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.auth) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { reservationId } = req.params;
      const tenantId = req.auth.tenantId;
      const userId = req.auth.sub || 'unknown';

      const { odometerKm, fuelLevel, photos, acknowledgedWarnings } = req.body;

      if (!odometerKm || !fuelLevel || !photos || photos.length !== 8) {
        return res.status(400).json({
          message: 'odometerKm, fuelLevel, and exactly 8 photos are required',
        });
      }

      const result = await OperationsService.completeReturn(
        tenantId,
        reservationId,
        userId,
        {
          odometerKm: Number(odometerKm),
          fuelLevel,
          photos,
          acknowledgedWarnings,
        }
      );

      res.json({
        success: true,
        return: result.return,
        warnings: result.warnings,
        message: 'Return completed successfully',
      });
    } catch (error: any) {
      console.error('Error completing return:', error);

      // Handle warnings response
      if (error.statusCode === 422 && error.warnings) {
        return res.status(422).json({
          message: 'Warnings must be acknowledged',
          warnings: error.warnings,
        });
      }

      res.status(400).json({ message: (error as Error).message });
    }
  }

  /**
   * GET /operations/damage-compare/:reservationId
   * Get damage compare data
   */
  static async getDamageCompare(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.auth) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { reservationId } = req.params;
      const tenantId = req.auth.tenantId;

      const result = await OperationsService.getDamageCompare(tenantId, reservationId);

      res.json(result);
    } catch (error) {
      console.error('Error getting damage compare:', error);
      res.status(400).json({ message: (error as Error).message });
    }
  }
}

