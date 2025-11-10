import { Request, Response } from 'express';
import { VehicleService } from '../services/vehicle.service';
import { SeasonName } from '../entities/vehicle-pricing-period.entity';
import { FuelType, TransmissionType } from '../entities/vehicle.entity';

export class RentacarController {
  static async listVehicles(req: Request, res: Response) {
    const tenantId = req.query.tenantId as string;
    if (!tenantId) {
      return res.status(400).json({ message: 'tenantId query param required' });
    }

    const vehicles = await VehicleService.listVehicles(tenantId);
    res.json(vehicles);
  }

  static async createVehicle(req: Request, res: Response) {
    try {
      const vehicle = await VehicleService.createVehicle({
        tenantId: req.body.tenantId,
        name: req.body.name,
        brand: req.body.brand,
        model: req.body.model,
        year: req.body.year,
        transmission: req.body.transmission as TransmissionType,
        fuelType: req.body.fuelType as FuelType,
        seats: req.body.seats,
        luggage: req.body.luggage,
        description: req.body.description,
        baseRate: req.body.baseRate,
        currencyCode: req.body.currencyCode,
      });
      res.status(201).json(vehicle);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  }

  static async addPlate(req: Request, res: Response) {
    try {
      const plate = await VehicleService.addPlate({
        vehicleId: req.params.vehicleId,
        plateNumber: req.body.plateNumber,
      });
      res.status(201).json(plate);
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
}
