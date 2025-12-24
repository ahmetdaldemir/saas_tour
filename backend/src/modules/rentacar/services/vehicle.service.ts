import { Repository, In } from 'typeorm';
import { AppDataSource } from '../../../config/data-source';
import { Vehicle, FuelType, TransmissionType } from '../entities/vehicle.entity';
import { VehiclePlate } from '../entities/vehicle-plate.entity';
import { VehiclePricingPeriod, SeasonName } from '../entities/vehicle-pricing-period.entity';
import { VehicleReservationAssignment } from '../entities/vehicle-reservation-assignment.entity';
import { VehicleCategory } from '../entities/vehicle-category.entity';
import { VehicleBrand } from '../entities/vehicle-brand.entity';
import { VehicleModel } from '../entities/vehicle-model.entity';
import { Location } from '../entities/location.entity';
import { Tenant, TenantCategory } from '../../tenants/entities/tenant.entity';
import { Reservation, ReservationStatus, ReservationType } from '../../shared/entities/reservation.entity';
import { Translation } from '../../shared/entities/translation.entity';

export type CreateVehicleInput = {
  tenantId: string;
  name: string;
  categoryId?: string | null;
  brandId?: string | null;
  modelId?: string | null;
  year?: number;
  transmission?: TransmissionType;
  fuelType?: FuelType;
  seats?: number;
  luggage?: number;
  largeLuggage?: number;
  smallLuggage?: number;
  doors?: number;
  engineSize?: string;
  horsepower?: string;
  bodyType?: string;
  hasHydraulicSteering?: boolean;
  isFourWheelDrive?: boolean;
  hasAirConditioning?: boolean;
  hasAbs?: boolean;
  hasRadio?: boolean;
  hasCd?: boolean;
  hasSunroof?: boolean;
  order?: number;
  description?: string;
  baseRate?: number;
  currencyCode?: string;
  // Legacy fields
  brand?: string;
  model?: string;
};

export type CreatePlateInput = {
  vehicleId: string;
  plateNumber: string;
  registrationDate?: string;
  documentNumber?: string;
  serialNumber?: string;
  km?: number;
  oilKm?: number;
  description?: string;
  comprehensiveInsuranceCompany?: string;
  comprehensiveInsuranceStart?: string;
  comprehensiveInsuranceEnd?: string;
  trafficInsuranceCompany?: string;
  trafficInsuranceStart?: string;
  trafficInsuranceEnd?: string;
  inspectionCompany?: string;
  inspectionStart?: string;
  inspectionEnd?: string;
  exhaustInspectionCompany?: string;
  exhaustInspectionStart?: string;
  exhaustInspectionEnd?: string;
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

    let category: VehicleCategory | null = null;
    if (input.categoryId) {
      const categoryRepo = AppDataSource.getRepository(VehicleCategory);
      category = await categoryRepo.findOne({ where: { id: input.categoryId } });
      if (!category) {
        throw new Error('Vehicle category not found');
      }
    }

    let brand: VehicleBrand | null = null;
    let brandName: string | undefined = input.brand;
    if (input.brandId) {
      const brandRepo = AppDataSource.getRepository(VehicleBrand);
      brand = await brandRepo.findOne({ where: { id: input.brandId } });
      if (!brand) {
        throw new Error('Vehicle brand not found');
      }
      brandName = brand.name;
    }

    let model: VehicleModel | null = null;
    let modelName: string | undefined = input.model;
    if (input.modelId) {
      const modelRepo = AppDataSource.getRepository(VehicleModel);
      model = await modelRepo.findOne({ where: { id: input.modelId } });
      if (!model) {
        throw new Error('Vehicle model not found');
      }
      modelName = model.name;
    }

    const vehicle = this.vehicleRepo().create({
      tenant,
      name: input.name,
      category,
      categoryId: input.categoryId || null,
      brand,
      brandId: input.brandId || null,
      model,
      modelId: input.modelId || null,
      brandName,
      modelName,
      year: input.year,
      transmission: input.transmission ?? TransmissionType.AUTOMATIC,
      fuelType: input.fuelType ?? FuelType.GASOLINE,
      seats: input.seats ?? 4,
      luggage: input.luggage ?? 2,
      largeLuggage: input.largeLuggage ?? 0,
      smallLuggage: input.smallLuggage ?? 0,
      doors: input.doors ?? 4,
      engineSize: input.engineSize,
      horsepower: input.horsepower,
      bodyType: input.bodyType,
      hasHydraulicSteering: input.hasHydraulicSteering ?? false,
      isFourWheelDrive: input.isFourWheelDrive ?? false,
      hasAirConditioning: input.hasAirConditioning ?? false,
      hasAbs: input.hasAbs ?? false,
      hasRadio: input.hasRadio ?? false,
      hasCd: input.hasCd ?? false,
      hasSunroof: input.hasSunroof ?? false,
      order: input.order ?? 0,
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
      registrationDate: input.registrationDate ? new Date(input.registrationDate) : undefined,
      documentNumber: input.documentNumber,
      serialNumber: input.serialNumber,
      km: input.km,
      oilKm: input.oilKm,
      description: input.description,
      comprehensiveInsuranceCompany: input.comprehensiveInsuranceCompany,
      comprehensiveInsuranceStart: input.comprehensiveInsuranceStart ? new Date(input.comprehensiveInsuranceStart) : undefined,
      comprehensiveInsuranceEnd: input.comprehensiveInsuranceEnd ? new Date(input.comprehensiveInsuranceEnd) : undefined,
      trafficInsuranceCompany: input.trafficInsuranceCompany,
      trafficInsuranceStart: input.trafficInsuranceStart ? new Date(input.trafficInsuranceStart) : undefined,
      trafficInsuranceEnd: input.trafficInsuranceEnd ? new Date(input.trafficInsuranceEnd) : undefined,
      inspectionCompany: input.inspectionCompany,
      inspectionStart: input.inspectionStart ? new Date(input.inspectionStart) : undefined,
      inspectionEnd: input.inspectionEnd ? new Date(input.inspectionEnd) : undefined,
      exhaustInspectionCompany: input.exhaustInspectionCompany,
      exhaustInspectionStart: input.exhaustInspectionStart ? new Date(input.exhaustInspectionStart) : undefined,
      exhaustInspectionEnd: input.exhaustInspectionEnd ? new Date(input.exhaustInspectionEnd) : undefined,
    });

    return this.plateRepo().save(plate);
  }

  static async updatePlate(plateId: string, input: Partial<CreatePlateInput>): Promise<VehiclePlate> {
    const plate = await this.plateRepo().findOne({ where: { id: plateId } });
    if (!plate) {
      throw new Error('Plate not found');
    }

    // Check if plate number is being changed and if it's already taken
    if (input.plateNumber && input.plateNumber !== plate.plateNumber) {
      const existingPlate = await this.plateRepo().findOne({ where: { plateNumber: input.plateNumber } });
      if (existingPlate) {
        throw new Error('Plate number already assigned to another vehicle');
      }
      plate.plateNumber = input.plateNumber;
    }

    if (input.registrationDate !== undefined) {
      plate.registrationDate = input.registrationDate ? new Date(input.registrationDate) : undefined;
    }
    if (input.documentNumber !== undefined) plate.documentNumber = input.documentNumber;
    if (input.serialNumber !== undefined) plate.serialNumber = input.serialNumber;
    if (input.km !== undefined) plate.km = input.km;
    if (input.oilKm !== undefined) plate.oilKm = input.oilKm;
    if (input.description !== undefined) plate.description = input.description;
    if (input.comprehensiveInsuranceCompany !== undefined) plate.comprehensiveInsuranceCompany = input.comprehensiveInsuranceCompany;
    if (input.comprehensiveInsuranceStart !== undefined) {
      plate.comprehensiveInsuranceStart = input.comprehensiveInsuranceStart ? new Date(input.comprehensiveInsuranceStart) : undefined;
    }
    if (input.comprehensiveInsuranceEnd !== undefined) {
      plate.comprehensiveInsuranceEnd = input.comprehensiveInsuranceEnd ? new Date(input.comprehensiveInsuranceEnd) : undefined;
    }
    if (input.trafficInsuranceCompany !== undefined) plate.trafficInsuranceCompany = input.trafficInsuranceCompany;
    if (input.trafficInsuranceStart !== undefined) {
      plate.trafficInsuranceStart = input.trafficInsuranceStart ? new Date(input.trafficInsuranceStart) : undefined;
    }
    if (input.trafficInsuranceEnd !== undefined) {
      plate.trafficInsuranceEnd = input.trafficInsuranceEnd ? new Date(input.trafficInsuranceEnd) : undefined;
    }
    if (input.inspectionCompany !== undefined) plate.inspectionCompany = input.inspectionCompany;
    if (input.inspectionStart !== undefined) {
      plate.inspectionStart = input.inspectionStart ? new Date(input.inspectionStart) : undefined;
    }
    if (input.inspectionEnd !== undefined) {
      plate.inspectionEnd = input.inspectionEnd ? new Date(input.inspectionEnd) : undefined;
    }
    if (input.exhaustInspectionCompany !== undefined) plate.exhaustInspectionCompany = input.exhaustInspectionCompany;
    if (input.exhaustInspectionStart !== undefined) {
      plate.exhaustInspectionStart = input.exhaustInspectionStart ? new Date(input.exhaustInspectionStart) : undefined;
    }
    if (input.exhaustInspectionEnd !== undefined) {
      plate.exhaustInspectionEnd = input.exhaustInspectionEnd ? new Date(input.exhaustInspectionEnd) : undefined;
    }

    return this.plateRepo().save(plate);
  }

  static async removePlate(plateId: string): Promise<void> {
    const plate = await this.plateRepo().findOne({ where: { id: plateId } });
    if (!plate) {
      throw new Error('Plate not found');
    }
    await this.plateRepo().remove(plate);
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

  static async updateVehicle(id: string, input: Partial<CreateVehicleInput>): Promise<Vehicle> {
    const vehicle = await this.vehicleRepo().findOne({ where: { id } });
    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    if (input.categoryId !== undefined) {
      if (input.categoryId) {
        const categoryRepo = AppDataSource.getRepository(VehicleCategory);
        const category = await categoryRepo.findOne({ where: { id: input.categoryId } });
        if (!category) {
          throw new Error('Vehicle category not found');
        }
        vehicle.category = category;
        vehicle.categoryId = input.categoryId;
      } else {
        vehicle.category = null;
        vehicle.categoryId = null;
      }
    }

    if (input.brandId !== undefined) {
      if (input.brandId) {
        const brandRepo = AppDataSource.getRepository(VehicleBrand);
        const brand = await brandRepo.findOne({ where: { id: input.brandId } });
        if (!brand) {
          throw new Error('Vehicle brand not found');
        }
        vehicle.brand = brand;
        vehicle.brandId = input.brandId;
        vehicle.brandName = brand.name;
      } else {
        vehicle.brand = null;
        vehicle.brandId = null;
        vehicle.brandName = input.brand;
      }
    }

    if (input.modelId !== undefined) {
      if (input.modelId) {
        const modelRepo = AppDataSource.getRepository(VehicleModel);
        const model = await modelRepo.findOne({ where: { id: input.modelId } });
        if (!model) {
          throw new Error('Vehicle model not found');
        }
        vehicle.model = model;
        vehicle.modelId = input.modelId;
        vehicle.modelName = model.name;
      } else {
        vehicle.model = null;
        vehicle.modelId = null;
        vehicle.modelName = input.model;
      }
    }

    if (input.name !== undefined) vehicle.name = input.name;
    if (input.year !== undefined) vehicle.year = input.year;
    if (input.transmission !== undefined) vehicle.transmission = input.transmission;
    if (input.fuelType !== undefined) vehicle.fuelType = input.fuelType;
    if (input.seats !== undefined) vehicle.seats = input.seats;
    if (input.luggage !== undefined) vehicle.luggage = input.luggage;
    if (input.largeLuggage !== undefined) vehicle.largeLuggage = input.largeLuggage;
    if (input.smallLuggage !== undefined) vehicle.smallLuggage = input.smallLuggage;
    if (input.doors !== undefined) vehicle.doors = input.doors;
    if (input.engineSize !== undefined) vehicle.engineSize = input.engineSize;
    if (input.horsepower !== undefined) vehicle.horsepower = input.horsepower;
    if (input.bodyType !== undefined) vehicle.bodyType = input.bodyType;
    if (input.hasHydraulicSteering !== undefined) vehicle.hasHydraulicSteering = input.hasHydraulicSteering;
    if (input.isFourWheelDrive !== undefined) vehicle.isFourWheelDrive = input.isFourWheelDrive;
    if (input.hasAirConditioning !== undefined) vehicle.hasAirConditioning = input.hasAirConditioning;
    if (input.hasAbs !== undefined) vehicle.hasAbs = input.hasAbs;
    if (input.hasRadio !== undefined) vehicle.hasRadio = input.hasRadio;
    if (input.hasCd !== undefined) vehicle.hasCd = input.hasCd;
    if (input.hasSunroof !== undefined) vehicle.hasSunroof = input.hasSunroof;
    if (input.order !== undefined) vehicle.order = input.order;
    if (input.description !== undefined) vehicle.description = input.description;
    if (input.baseRate !== undefined) vehicle.baseRate = input.baseRate;
    if (input.currencyCode !== undefined) vehicle.currencyCode = input.currencyCode;

    return this.vehicleRepo().save(vehicle);
  }

  static async listVehicles(tenantId: string): Promise<Vehicle[]> {
    const vehicles = await this.vehicleRepo().find({
      where: { tenantId },
      relations: ['category', 'brand', 'model', 'plates', 'pricingPeriods', 'lastReturnLocation', 'images'],
      order: { order: 'ASC', createdAt: 'DESC' },
    });

    // Load translations separately for categories to avoid nested relation issues
    if (vehicles.length > 0) {
      const categoryIds = vehicles
        .map(v => v.categoryId)
        .filter((id): id is string => id !== null && id !== undefined);
      
      if (categoryIds.length > 0) {
        const translationRepo = AppDataSource.getRepository(Translation);
        const translations = await translationRepo.find({
          where: {
            model: 'VehicleCategory',
            modelId: In(categoryIds),
          },
          relations: ['language'],
        });

        // Group translations by category ID
        const translationsByCategory = new Map<string, typeof translations>();
        translations.forEach(t => {
          const key = t.modelId;
          if (!translationsByCategory.has(key)) {
            translationsByCategory.set(key, []);
          }
          translationsByCategory.get(key)!.push(t);
        });

        // Attach translations to category entities
        vehicles.forEach(vehicle => {
          if (vehicle.category && vehicle.categoryId) {
            (vehicle.category as any).translations = translationsByCategory.get(vehicle.categoryId) || [];
          }
        });
      }
    }

    return vehicles;
  }

  static async updateLastReturnLocation(vehicleId: string, locationId: string | null): Promise<Vehicle> {
    const vehicle = await this.vehicleRepo().findOne({ where: { id: vehicleId } });
    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    if (locationId) {
      const locationRepo = AppDataSource.getRepository(Location);
      const location = await locationRepo.findOne({ where: { id: locationId } });
      if (!location) {
        throw new Error('Location not found');
      }
      if (location.tenantId !== vehicle.tenantId) {
        throw new Error('Location and vehicle belong to different tenants');
      }
      vehicle.lastReturnLocation = location;
      vehicle.lastReturnLocationId = locationId;
    } else {
      vehicle.lastReturnLocation = null;
      vehicle.lastReturnLocationId = null;
    }

    return this.vehicleRepo().save(vehicle);
  }
}
