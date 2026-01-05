import { Response } from 'express';
import { VehicleDamageDetectionService } from '../services/vehicle-damage-detection.service';
import { AuthenticatedRequest } from '../../auth/middleware/auth.middleware';

export class VehicleDamageDetectionController {
  /**
   * Process damage detection
   * POST /rentacar/vehicles/:vehicleId/reservations/:reservationId/damage-detection
   */
  static async processDetection(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { vehicleId, reservationId } = req.params;
      const { checkinPhotoUrls, checkoutPhotoUrls } = req.body;

      if (!checkinPhotoUrls || !Array.isArray(checkinPhotoUrls) || checkinPhotoUrls.length === 0) {
        return res.status(400).json({ message: 'checkinPhotoUrls is required and must be a non-empty array' });
      }

      if (!checkoutPhotoUrls || !Array.isArray(checkoutPhotoUrls) || checkoutPhotoUrls.length === 0) {
        return res.status(400).json({ message: 'checkoutPhotoUrls is required and must be a non-empty array' });
      }

      const detection = await VehicleDamageDetectionService.processDetection(
        {
          vehicleId,
          reservationId,
          checkinPhotoUrls,
          checkoutPhotoUrls,
        },
        tenantId
      );

      res.json({
        success: true,
        message: 'Damage detection completed',
        data: detection,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  /**
   * Get detection by ID
   * GET /rentacar/damage-detections/:id
   */
  static async getById(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { id } = req.params;
      const detection = await VehicleDamageDetectionService.getById(id, tenantId);

      if (!detection) {
        return res.status(404).json({ message: 'Detection not found' });
      }

      res.json({
        success: true,
        data: detection,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  /**
   * Get detections for a vehicle
   * GET /rentacar/vehicles/:vehicleId/damage-detections
   */
  static async getByVehicle(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { vehicleId } = req.params;
      const detections = await VehicleDamageDetectionService.getByVehicle(vehicleId, tenantId);

      res.json({
        success: true,
        data: detections,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  /**
   * Get detection for a reservation
   * GET /rentacar/reservations/:reservationId/damage-detection
   */
  static async getByReservation(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { reservationId } = req.params;
      const detection = await VehicleDamageDetectionService.getByReservation(reservationId, tenantId);

      if (!detection) {
        return res.status(404).json({ message: 'Detection not found' });
      }

      res.json({
        success: true,
        data: detection,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }

  /**
   * Verify detection (human verification)
   * POST /rentacar/damage-detections/:id/verify
   */
  static async verifyDetection(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const userId = req.auth?.userId;
      if (!userId) {
        return res.status(401).json({ message: 'User ID required' });
      }

      const { id } = req.params;
      const { isDamage, notes } = req.body;

      if (typeof isDamage !== 'boolean') {
        return res.status(400).json({ message: 'isDamage must be a boolean' });
      }

      const detection = await VehicleDamageDetectionService.verifyDetection(
        id,
        tenantId,
        userId,
        isDamage,
        notes
      );

      res.json({
        success: true,
        message: 'Detection verified',
        data: detection,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: (error as Error).message,
      });
    }
  }
}

