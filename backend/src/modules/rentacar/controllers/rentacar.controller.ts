import { Request, Response } from 'express';
import { VehicleService } from '../services/vehicle.service';
import { SeasonName } from '../entities/vehicle-pricing-period.entity';
import { AppDataSource } from '../../../config/data-source';
import { Vehicle } from '../entities/vehicle.entity';

export class RentacarController {
  static async listVehicles(req: Request, res: Response) {
    const tenantId = req.query.tenantId as string;
    if (!tenantId) {
      return res.status(400).json({ message: 'tenantId query param required' });
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
  }

  static async createVehicle(req: Request, res: Response) {
    try {
      const vehicle = await VehicleService.createVehicle(req.body);
      res.status(201).json(vehicle);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async updateVehicle(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const vehicle = await VehicleService.updateVehicle(id, req.body);
      res.json(vehicle);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async getVehicle(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const vehicle = await VehicleService.listVehicles(req.query.tenantId as string);
      const found = vehicle.find(v => v.id === id);
      if (!found) {
        return res.status(404).json({ message: 'Vehicle not found' });
      }
      res.json(found);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  }

  static async deleteVehicle(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const vehicleRepo = AppDataSource.getRepository(Vehicle);
      const vehicle = await vehicleRepo.findOne({ where: { id } });
      if (!vehicle) {
        return res.status(404).json({ message: 'Vehicle not found' });
      }
      await vehicleRepo.remove(vehicle);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async addPlate(req: Request, res: Response) {
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

  static async updatePlate(req: Request, res: Response) {
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

  static async deletePlate(req: Request, res: Response) {
    try {
      const { plateId } = req.params;
      await VehicleService.removePlate(plateId);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async upsertPricing(req: Request, res: Response) {
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

  static async assignPlate(req: Request, res: Response) {
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

  static async updateLastReturnLocation(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { locationId } = req.body;
      const vehicle = await VehicleService.updateLastReturnLocation(id, locationId || null);
      res.json(vehicle);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }
}
