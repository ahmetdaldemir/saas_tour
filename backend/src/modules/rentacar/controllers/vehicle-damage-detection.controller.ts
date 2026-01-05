import { Response } from 'express';
import { VehicleDamageDetectionService } from '../services/vehicle-damage-detection.service';
import { OperationsService } from '../services/operations.service';
import { AuthenticatedRequest } from '../../auth/middleware/auth.middleware';

export class VehicleDamageDetectionController {
  /**
   * Process damage detection
   * POST /rentacar/vehicles/:vehicleId/reservations/:reservationId/damage-detection
   * 
   * If checkinPhotoUrls and checkoutPhotoUrls are not provided, automatically fetch from operations system
   */
  static async processDetection(req: AuthenticatedRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { vehicleId, reservationId } = req.params;
      let { checkinPhotoUrls, checkoutPhotoUrls } = req.body;

      // If photos not provided, try to fetch from operations system
      if (!checkinPhotoUrls || !Array.isArray(checkinPhotoUrls) || checkinPhotoUrls.length === 0 ||
          !checkoutPhotoUrls || !Array.isArray(checkoutPhotoUrls) || checkoutPhotoUrls.length === 0) {
        try {
          const damageCompare = await OperationsService.getDamageCompare(tenantId, reservationId);
          
          // Use pickup photos as checkin (pickup = check-in)
          if (damageCompare.pickupPhotos && damageCompare.pickupPhotos.length > 0) {
            checkinPhotoUrls = damageCompare.pickupPhotos.map(p => p.url);
          }
          
          // Use return photos as checkout (return = check-out)
          if (damageCompare.returnPhotos && damageCompare.returnPhotos.length > 0) {
            checkoutPhotoUrls = damageCompare.returnPhotos.map(p => p.url);
          }
        } catch (opsError) {
          console.warn('Could not fetch photos from operations system:', opsError);
          // Continue with validation below
        }
      }

      if (!checkinPhotoUrls || !Array.isArray(checkinPhotoUrls) || checkinPhotoUrls.length === 0) {
        return res.status(400).json({ 
          message: 'checkinPhotoUrls is required and must be a non-empty array. Please complete pickup operation first or provide photos manually.' 
        });
      }

      if (!checkoutPhotoUrls || !Array.isArray(checkoutPhotoUrls) || checkoutPhotoUrls.length === 0) {
        return res.status(400).json({ 
          message: 'checkoutPhotoUrls is required and must be a non-empty array. Please complete return operation first or provide photos manually.' 
        });
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

      const { id } = req.params;
      const { isDamage, notes } = req.body;

      if (typeof isDamage !== 'boolean') {
        return res.status(400).json({ message: 'isDamage must be a boolean' });
      }

      const detection = await VehicleDamageDetectionService.verifyDetection(
        id,
        tenantId,
        req.auth?.sub || tenantId,
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

