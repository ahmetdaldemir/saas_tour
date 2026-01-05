import { Response } from 'express';
import { AuthenticatedRequest } from '../../auth/middleware/auth.middleware';
import { TenantRequest } from '../../../middleware/tenant.middleware';
import { OpsTaskService } from '../services/ops-task.service';
import { OpsTaskType, OpsTaskStatus } from '../entities/ops-task.entity';
import { ReservationService } from '../../shared/services/reservation.service';
import { VehicleReservationAssignment } from '../../rentacar/entities/vehicle-reservation-assignment.entity';
import { AppDataSource } from '../../../config/data-source';

/**
 * DTO for mobile - only exposes minimal fields (no PII except name)
 */
interface OpsTaskMobileDto {
  id: string;
  type: OpsTaskType;
  status: OpsTaskStatus;
  reservation: {
    id: string;
    reference: string;
    customerName: string; // Only name, no email/phone
    checkIn?: Date | null;
    checkOut?: Date | null;
  };
  vehicle?: {
    plateNumber?: string;
    brand?: string;
    model?: string;
    year?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export class OpsTaskController {
  /**
   * Get tasks list (mobile-optimized, privacy-safe)
   */
  static async list(req: AuthenticatedRequest & TenantRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId || req.tenant?.id;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { type, status, dateFrom, dateTo } = req.query;

      const tasks = await OpsTaskService.getTasks(tenantId, {
        type: type as OpsTaskType | undefined,
        status: status as OpsTaskStatus | undefined,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
      });

      // Transform to mobile DTO
      const assignmentRepo = AppDataSource.getRepository(VehicleReservationAssignment);
      const dtos: OpsTaskMobileDto[] = await Promise.all(
        tasks.map(async (task) => {
          const reservation = await ReservationService.getById(task.reservationId);
          const assignment = await assignmentRepo.findOne({
            where: { reservationId: task.reservationId },
            relations: ['plate', 'plate.vehicle', 'plate.vehicle.brand', 'plate.vehicle.model'],
          });

          return {
            id: task.id,
            type: task.type,
            status: task.status,
            reservation: {
              id: reservation?.id || task.reservationId,
              reference: reservation?.reference || 'N/A',
              customerName: reservation?.customerName || 'N/A', // Only name!
              checkIn: reservation?.checkIn || null,
              checkOut: reservation?.checkOut || null,
            },
            vehicle: assignment?.plate
              ? {
                  plateNumber: assignment.plate.plateNumber,
                  brand: assignment.plate.vehicle?.brand?.name || assignment.plate.vehicle?.brandName,
                  model: assignment.plate.vehicle?.model?.name || assignment.plate.vehicle?.modelName,
                  year: assignment.plate.vehicle?.year,
                }
              : undefined,
            createdAt: task.createdAt,
            updatedAt: task.updatedAt,
          };
        })
      );

      res.json(dtos);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  /**
   * Get task by ID (mobile-optimized, privacy-safe)
   */
  static async getById(req: AuthenticatedRequest & TenantRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId || req.tenant?.id;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { id } = req.params;
      const task = await OpsTaskService.getTaskById(id, tenantId);

      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }

      // Transform to mobile DTO
      const reservation = await ReservationService.getById(task.reservationId);
      const assignmentRepo = AppDataSource.getRepository(VehicleReservationAssignment);
      const assignment = await assignmentRepo.findOne({
        where: { reservationId: task.reservationId },
        relations: ['plate', 'plate.vehicle', 'plate.vehicle.brand', 'plate.vehicle.model'],
      });

      const dto: OpsTaskMobileDto = {
        id: task.id,
        type: task.type,
        status: task.status,
        reservation: {
          id: reservation?.id || task.reservationId,
          reference: reservation?.reference || 'N/A',
          customerName: reservation?.customerName || 'N/A', // Only name!
          checkIn: reservation?.checkIn || null,
          checkOut: reservation?.checkOut || null,
        },
        vehicle: assignment?.plate
          ? {
              plateNumber: assignment.plate.plateNumber,
              brand: assignment.plate.vehicle?.brand?.name || assignment.plate.vehicle?.brandName,
              model: assignment.plate.vehicle?.model?.name || assignment.plate.vehicle?.modelName,
              year: assignment.plate.vehicle?.year,
            }
          : undefined,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      };

      res.json(dto);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  /**
   * Create or get task
   */
  static async createOrGet(req: AuthenticatedRequest & TenantRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId || req.tenant?.id;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { reservationId, type } = req.body;

      if (!reservationId || !type) {
        return res.status(400).json({ message: 'reservationId and type are required' });
      }

      const task = await OpsTaskService.createOrGetTask({ reservationId, type: type as OpsTaskType }, tenantId);
      res.json({ id: task.id, type: task.type, status: task.status });
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  /**
   * Update task media
   */
  static async updateMedia(req: AuthenticatedRequest & TenantRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId || req.tenant?.id;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { id } = req.params;
      const { mediaIds } = req.body;

      if (!Array.isArray(mediaIds)) {
        return res.status(400).json({ message: 'mediaIds must be an array' });
      }

      const task = await OpsTaskService.updateMedia(id, tenantId, { mediaIds });
      res.json({ id: task.id, mediaIds: task.mediaIds });
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  /**
   * Verify documents
   */
  static async verifyDocs(req: AuthenticatedRequest & TenantRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId || req.tenant?.id;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { id } = req.params;
      const { licenseVerified, licenseMediaIds, passportVerified, passportMediaIds } = req.body;

      const task = await OpsTaskService.verifyDocs(id, tenantId, {
        licenseVerified: Boolean(licenseVerified),
        licenseMediaIds: Array.isArray(licenseMediaIds) ? licenseMediaIds : [],
        passportVerified: Boolean(passportVerified),
        passportMediaIds: Array.isArray(passportMediaIds) ? passportMediaIds : [],
      });

      res.json({
        id: task.id,
        licenseVerified: task.licenseVerified,
        passportVerified: task.passportVerified,
      });
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  /**
   * Finalize checkout
   */
  static async finalizeCheckout(req: AuthenticatedRequest & TenantRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId || req.tenant?.id;
      const userId = req.auth?.sub;
      if (!tenantId || !userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { id } = req.params;
      const result = await OpsTaskService.finalizeCheckout(id, tenantId, userId);

      res.json(result);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  /**
   * Finalize return
   */
  static async finalizeReturn(req: AuthenticatedRequest & TenantRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId || req.tenant?.id;
      const userId = req.auth?.sub;
      if (!tenantId || !userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { id } = req.params;
      const { fuelLevel, mileage, damageNotes, damageMediaIds } = req.body;

      await OpsTaskService.finalizeReturn(id, tenantId, userId, {
        fuelLevel: fuelLevel ? Number(fuelLevel) : undefined,
        mileage: mileage ? Number(mileage) : undefined,
        damageNotes,
        damageMediaIds: Array.isArray(damageMediaIds) ? damageMediaIds : [],
      });

      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  /**
   * Get print payload
   */
  static async getPrintPayload(req: AuthenticatedRequest & TenantRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId || req.tenant?.id;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { id } = req.params;
      const task = await OpsTaskService.getTaskById(id, tenantId);

      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }

      // Generate print payload (reuse service method)
      const printPayload = await OpsTaskService.generatePrintPayload(task);

      res.json(printPayload);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  /**
   * Start task (track start time)
   */
  static async startTask(req: AuthenticatedRequest & TenantRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId || req.tenant?.id;
      const userId = req.auth?.sub;
      if (!tenantId || !userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { id } = req.params;
      const task = await OpsTaskService.startTask(id, tenantId, userId);

      res.json({ success: true, task });
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  /**
   * Update checklist progress
   */
  static async updateChecklist(req: AuthenticatedRequest & TenantRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId || req.tenant?.id;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { id } = req.params;
      const { itemsTotal, itemsCompleted } = req.body;

      const task = await OpsTaskService.updateChecklist(id, tenantId, {
        itemsTotal: parseInt(itemsTotal),
        itemsCompleted: parseInt(itemsCompleted),
      });

      res.json({ success: true, task });
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  /**
   * Update media counts
   */
  static async updateMediaCounts(req: AuthenticatedRequest & TenantRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId || req.tenant?.id;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { id } = req.params;
      const { requiredPhotos, uploadedPhotos, requiredVideos, uploadedVideos } = req.body;

      const task = await OpsTaskService.updateMediaCounts(id, tenantId, {
        requiredPhotos: requiredPhotos ? parseInt(requiredPhotos) : undefined,
        uploadedPhotos: uploadedPhotos ? parseInt(uploadedPhotos) : undefined,
        requiredVideos: requiredVideos ? parseInt(requiredVideos) : undefined,
        uploadedVideos: uploadedVideos ? parseInt(uploadedVideos) : undefined,
      });

      res.json({ success: true, task });
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  /**
   * Record task error
   */
  static async recordError(req: AuthenticatedRequest & TenantRequest, res: Response) {
    try {
      const tenantId = req.auth?.tenantId || req.tenant?.id;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { id } = req.params;
      const { errorType, description } = req.body;

      const task = await OpsTaskService.recordError(id, tenantId, {
        errorType: errorType as 'dataEntry' | 'verification' | 'other',
        description,
      });

      res.json({ success: true, task });
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }
}

