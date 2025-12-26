import { Request, Response } from 'express';
import { VehicleService } from '../services/vehicle.service';
import { VehicleImageService } from '../services/vehicle-image.service';
import { SeasonName } from '../entities/vehicle-pricing-period.entity';
import { AppDataSource } from '../../../config/data-source';
import { Vehicle } from '../entities/vehicle.entity';
import { AuthenticatedRequest } from '../../auth/middleware/auth.middleware';
import { asyncHandler } from '../../../utils/errors';
import path from 'path';
import fs from 'fs';
import { processImageTo72DPI } from '../../../utils/image-processor';

export class RentacarController {
  static listVehicles = asyncHandler(async (req: Request, res: Response) => {
    // Get tenantId from query parameter (no authentication required)
    const tenantId = req.query.tenantId as string | undefined;
    if (!tenantId) {
      return res.status(400).json({ message: 'tenantId is required' });
    }

    const vehicles = await VehicleService.listVehicles(tenantId);
    
    // Convert TypeORM entities to plain JSON objects and populate brand/model info
    const vehiclesWithBrandModel = vehicles.map(vehicle => {
      // Use JSON parse/stringify to get plain object from TypeORM entity
      const vehicleData = JSON.parse(JSON.stringify(vehicle));
      
      // Populate brandName and brandId from brand relation if available
      if (vehicle.brand) {
        if (!vehicleData.brandName && vehicle.brand.name) {
          vehicleData.brandName = vehicle.brand.name;
        }
        if (!vehicleData.brandId && vehicle.brand.id) {
          vehicleData.brandId = vehicle.brand.id;
        }
        vehicleData.brand = vehicle.brand;
      }
      
      // Populate modelName and modelId from model relation if available
      if (vehicle.model) {
        if (!vehicleData.modelName && vehicle.model.name) {
          vehicleData.modelName = vehicle.model.name;
        }
        if (!vehicleData.modelId && vehicle.model.id) {
          vehicleData.modelId = vehicle.model.id;
        }
        vehicleData.model = vehicle.model;
      }
      
      return vehicleData;
    });
    
    res.json(vehiclesWithBrandModel);
  });

  static async createVehicle(req: AuthenticatedRequest, res: Response) {
    try {
      // Get tenantId from authenticated user's token (security: prevent tenant spoofing)
      const tenantId = req.auth?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Override tenantId from body to prevent security issues
      const vehicle = await VehicleService.createVehicle({
        ...req.body,
        tenantId, // Always use authenticated user's tenantId
      });
      res.status(201).json(vehicle);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async updateVehicle(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      // Get tenantId from authenticated user's token (security)
      const tenantId = req.auth?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      // Override tenantId from body to prevent security issues
      const vehicle = await VehicleService.updateVehicle(id, {
        ...req.body,
        tenantId, // Always use authenticated user's tenantId
      });
      res.json(vehicle);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async getVehicle(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      // Get tenantId from authenticated user's token (security)
      const tenantId = req.auth?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      const vehicle = await VehicleService.listVehicles(tenantId);
      const found = vehicle.find(v => v.id === id);
      if (!found) {
        return res.status(404).json({ message: 'Vehicle not found' });
      }
      res.json(found);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async deleteVehicle(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      // Get tenantId from authenticated user's token (security)
      const tenantId = req.auth?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      const vehicleRepo = AppDataSource.getRepository(Vehicle);
      const vehicle = await vehicleRepo.findOne({ where: { id, tenantId } });
      if (!vehicle) {
        return res.status(404).json({ message: 'Vehicle not found' });
      }
      await vehicleRepo.remove(vehicle);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async addPlate(req: AuthenticatedRequest, res: Response) {
    try {
      const plate = await VehicleService.addPlate({
        vehicleId: req.params.vehicleId,
        plateNumber: req.body.plateNumber,
        registrationDate: req.body.registrationDate,
        documentNumber: req.body.documentNumber,
        serialNumber: req.body.serialNumber,
        km: req.body.km,
        oilKm: req.body.oilKm,
        description: req.body.description,
        comprehensiveInsuranceCompany: req.body.comprehensiveInsuranceCompany,
        comprehensiveInsuranceStart: req.body.comprehensiveInsuranceStart,
        comprehensiveInsuranceEnd: req.body.comprehensiveInsuranceEnd,
        trafficInsuranceCompany: req.body.trafficInsuranceCompany,
        trafficInsuranceStart: req.body.trafficInsuranceStart,
        trafficInsuranceEnd: req.body.trafficInsuranceEnd,
        inspectionCompany: req.body.inspectionCompany,
        inspectionStart: req.body.inspectionStart,
        inspectionEnd: req.body.inspectionEnd,
        exhaustInspectionCompany: req.body.exhaustInspectionCompany,
        exhaustInspectionStart: req.body.exhaustInspectionStart,
        exhaustInspectionEnd: req.body.exhaustInspectionEnd,
      });
      res.status(201).json(plate);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async updatePlate(req: AuthenticatedRequest, res: Response) {
    try {
      const { vehicleId, plateId } = req.params;
      const plate = await VehicleService.updatePlate(plateId, {
        vehicleId,
        plateNumber: req.body.plateNumber,
        registrationDate: req.body.registrationDate,
        documentNumber: req.body.documentNumber,
        serialNumber: req.body.serialNumber,
        km: req.body.km,
        oilKm: req.body.oilKm,
        description: req.body.description,
        comprehensiveInsuranceCompany: req.body.comprehensiveInsuranceCompany,
        comprehensiveInsuranceStart: req.body.comprehensiveInsuranceStart,
        comprehensiveInsuranceEnd: req.body.comprehensiveInsuranceEnd,
        trafficInsuranceCompany: req.body.trafficInsuranceCompany,
        trafficInsuranceStart: req.body.trafficInsuranceStart,
        trafficInsuranceEnd: req.body.trafficInsuranceEnd,
        inspectionCompany: req.body.inspectionCompany,
        inspectionStart: req.body.inspectionStart,
        inspectionEnd: req.body.inspectionEnd,
        exhaustInspectionCompany: req.body.exhaustInspectionCompany,
        exhaustInspectionStart: req.body.exhaustInspectionStart,
        exhaustInspectionEnd: req.body.exhaustInspectionEnd,
      });
      res.json(plate);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async deletePlate(req: AuthenticatedRequest, res: Response) {
    try {
      const { plateId } = req.params;
      await VehicleService.removePlate(plateId);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async upsertPricing(req: AuthenticatedRequest, res: Response) {
    try {
      const pricing = await VehicleService.upsertPricing({
        vehicleId: req.params.vehicleId,
        season: req.body.season as SeasonName,
        month: req.body.month,
        dailyRate: req.body.dailyRate,
        weeklyRate: req.body.weeklyRate,
      });
      res.status(201).json(pricing);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async assignPlate(req: AuthenticatedRequest, res: Response) {
    try {
      const assignment = await VehicleService.assignPlate({
        reservationId: req.params.reservationId,
        plateId: req.body.plateId,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
      });
      res.status(201).json(assignment);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async updateLastReturnLocation(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const { locationId } = req.body as any;
      const vehicle = await VehicleService.updateLastReturnLocation(id, locationId || null);
      res.json(vehicle);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async uploadVehicleImage(req: AuthenticatedRequest, res: Response) {
    try {
      const { vehicleId } = req.params;
      const tenantId = req.auth?.tenantId;

      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      // Get uploads directory
      let uploadsDir: string;
      if (__dirname.includes('dist')) {
        uploadsDir = path.join(__dirname, '../../../public/uploads');
      } else {
        uploadsDir = path.join(__dirname, '../../../public/uploads');
      }

      const originalPath = path.join(uploadsDir, req.file.filename);
      
      // Process image to 72 DPI
      const processedFilename = `vehicle-${Date.now()}-${Math.round(Math.random() * 1e9)}.jpg`;
      const processedPath = path.join(uploadsDir, processedFilename);
      
      await processImageTo72DPI(originalPath, processedPath);
      
      // Delete original file
      if (fs.existsSync(originalPath)) {
        fs.unlinkSync(originalPath);
      }

      // Create public URL
      const fileUrl = `/uploads/${processedFilename}`;

      // Save image record
      const image = await VehicleImageService.create(
        {
          vehicleId,
          url: fileUrl,
          alt: req.body.alt,
          order: req.body.order ? parseInt(req.body.order) : undefined,
          isPrimary: req.body.isPrimary === 'true' || req.body.isPrimary === true,
        },
        tenantId
      );

      res.status(201).json(image);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async listVehicleImages(req: AuthenticatedRequest, res: Response) {
    try {
      const { vehicleId } = req.params;
      const tenantId = req.auth?.tenantId;

      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const images = await VehicleImageService.list(vehicleId, tenantId);
      res.json(images);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async updateVehicleImage(req: AuthenticatedRequest, res: Response) {
    try {
      const { vehicleId, imageId } = req.params;
      const tenantId = req.auth?.tenantId;

      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const image = await VehicleImageService.update(
        imageId,
        vehicleId,
        tenantId,
        {
          alt: req.body.alt,
          order: req.body.order,
          isPrimary: req.body.isPrimary,
        }
      );

      res.json(image);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async deleteVehicleImage(req: AuthenticatedRequest, res: Response) {
    try {
      const { vehicleId, imageId } = req.params;
      const tenantId = req.auth?.tenantId;

      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Get image to delete file
      const image = await VehicleImageService.getById(imageId, vehicleId, tenantId);
      if (image) {
        // Delete file from filesystem
        let uploadsDir: string;
        if (__dirname.includes('dist')) {
          uploadsDir = path.join(__dirname, '../../../public/uploads');
        } else {
          uploadsDir = path.join(__dirname, '../../../public/uploads');
        }

        const filePath = path.join(uploadsDir, path.basename(image.url));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      await VehicleImageService.delete(imageId, vehicleId, tenantId);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async reorderVehicleImages(req: AuthenticatedRequest, res: Response) {
    try {
      const { vehicleId } = req.params;
      const tenantId = req.auth?.tenantId;

      if (!tenantId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const { imageIds } = req.body;

      if (!Array.isArray(imageIds)) {
        return res.status(400).json({ message: 'imageIds must be an array' });
      }

      const images = await VehicleImageService.reorder(vehicleId, tenantId, imageIds);
      res.json(images);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }
}
