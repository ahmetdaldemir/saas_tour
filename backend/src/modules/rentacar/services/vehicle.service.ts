import { Repository } from 'typeorm';
import { AppDataSource } from '../../../config/data-source';
import { Vehicle, FuelType, TransmissionType } from '../entities/vehicle.entity';
import { VehiclePlate } from '../entities/vehicle-plate.entity';
import { VehiclePricingPeriod, SeasonName } from '../entities/vehicle-pricing-period.entity';
import { VehicleReservationAssignment } from '../entities/vehicle-reservation-assignment.entity';
import { Tenant, TenantCategory } from '../../tenants/entities/tenant.entity';
import { Reservation, ReservationStatus, ReservationType } from '../../shared/entities/reservation.entity';

export type CreateVehicleInput = {
  tenantId: string;
  name: string;
  brand: string;
  model: string;
  year?: number;
  transmission?: TransmissionType;
  fuelType?: FuelType;
  seats?: number;
  luggage?: number;
  description?: string;
  baseRate?: number;
  currencyCode?: string;
};

export type CreatePlateInput = {
  vehicleId: string;
  plateNumber: string;
};

export type UpsertPricingInput = {
  vehicleId: string;
  season: SeasonName;
  month: number;
  dailyRate: number;
  weeklyRate?: number | null;
};

export type AssignPlateInput = {
  reservationId: string;
  plateId: string;
  startDate: string;
  endDate: string;
};

export class VehicleService {
  private static vehicleRepo(): Repository<Vehicle> {
    return AppDataSource.getRepository(Vehicle);
  }

  private static plateRepo(): Repository<VehiclePlate> {
    return AppDataSource.getRepository(VehiclePlate);
  }

  private static pricingRepo(): Repository<VehiclePricingPeriod> {
    return AppDataSource.getRepository(VehiclePricingPeriod);
  }

  private static assignmentRepo(): Repository<VehicleReservationAssignment> {
    return AppDataSource.getRepository(VehicleReservationAssignment);
  }

  static async createVehicle(input: CreateVehicleInput): Promise<Vehicle> {
    const tenantRepo = AppDataSource.getRepository(Tenant);
    const tenant = await tenantRepo.findOne({ where: { id: input.tenantId } });

    if (!tenant) {
      throw new Error('Tenant not found');
    }
    if (tenant.category !== TenantCategory.RENTACAR) {
      throw new Error('Tenant category must be rentacar');
    }

    const vehicle = this.vehicleRepo().create({
      tenant,
      name: input.name,
      brand: input.brand,
      model: input.model,
      year: input.year,
      transmission: input.transmission ?? TransmissionType.AUTOMATIC,
      fuelType: input.fuelType ?? FuelType.GASOLINE,
      seats: input.seats ?? 4,
      luggage: input.luggage ?? 2,
      description: input.description,
      baseRate: input.baseRate ?? 0,
      currencyCode: input.currencyCode ?? 'EUR',
    });

    return this.vehicleRepo().save(vehicle);
  }

  static async addPlate(input: CreatePlateInput): Promise<VehiclePlate> {
    const vehicle = await this.vehicleRepo().findOne({ where: { id: input.vehicleId } });
    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    const existingPlate = await this.plateRepo().findOne({ where: { plateNumber: input.plateNumber } });
    if (existingPlate) {
      throw new Error('Plate already assigned');
    }

    const plate = this.plateRepo().create({
      vehicle,
      plateNumber: input.plateNumber,
    });

    return this.plateRepo().save(plate);
  }

  static async upsertPricing(input: UpsertPricingInput): Promise<VehiclePricingPeriod> {
    if (input.month < 1 || input.month > 12) {
      throw new Error('Month must be between 1 and 12');
    }

    const vehicle = await this.vehicleRepo().findOne({ where: { id: input.vehicleId } });
    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    let pricing = await this.pricingRepo().findOne({ where: { vehicleId: input.vehicleId, month: input.month } });

    if (!pricing) {
      pricing = this.pricingRepo().create({
        vehicle,
        season: input.season,
        month: input.month,
        dailyRate: input.dailyRate,
        weeklyRate: input.weeklyRate ?? null,
      });
    } else {
      pricing.season = input.season;
      pricing.dailyRate = input.dailyRate;
      pricing.weeklyRate = input.weeklyRate ?? null;
    }

    return this.pricingRepo().save(pricing);
  }

  static async assignPlate(input: AssignPlateInput): Promise<VehicleReservationAssignment> {
    const reservationRepo = AppDataSource.getRepository(Reservation);

    const reservation = await reservationRepo.findOne({ where: { id: input.reservationId } });
    if (!reservation) {
      throw new Error('Reservation not found');
    }
    if (reservation.type !== ReservationType.RENTACAR) {
      throw new Error('Reservation type must be rentacar');
    }

    if (![ReservationStatus.CONFIRMED, ReservationStatus.PENDING].includes(reservation.status)) {
      throw new Error('Reservation must be pending or confirmed to assign a plate');
    }

    const plate = await this.plateRepo().findOne({ where: { id: input.plateId }, relations: ['vehicle'] });
    if (!plate) {
      throw new Error('Plate not found');
    }

    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error('Invalid date range');
    }
    if (startDate >= endDate) {
      throw new Error('Start date must be before end date');
    }

    if (reservation.tenantId !== plate.vehicle.tenantId) {
      throw new Error('Reservation and plate belong to different tenants');
    }

    const overlapping = await this.assignmentRepo()
      .createQueryBuilder('assignment')
      .where('assignment.plateId = :plateId', { plateId: plate.id })
      .andWhere('assignment.startDate < :endDate AND assignment.endDate > :startDate', {
        startDate,
        endDate,
      })
      .getOne();

    if (overlapping) {
      throw new Error('Plate already assigned in this period');
    }

    let assignment = await this.assignmentRepo().findOne({ where: { reservationId: reservation.id } });
    if (!assignment) {
      assignment = this.assignmentRepo().create({
        reservation,
        plate,
        startDate,
        endDate,
      });
    } else {
      assignment.plate = plate;
      assignment.plateId = plate.id;
      assignment.startDate = startDate;
      assignment.endDate = endDate;
    }

    return this.assignmentRepo().save(assignment);
  }

  static listVehicles(tenantId: string): Promise<Vehicle[]> {
    return this.vehicleRepo().find({ where: { tenantId }, relations: ['plates', 'pricingPeriods'] });
  }
}
