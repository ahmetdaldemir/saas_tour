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
import { LocationVehiclePricing, DayRange } from '../entities/location-vehicle-pricing.entity';
import { LocationPricingService } from './location-pricing.service';
import { CurrencyService } from '../../shared/services/currency.service';
import { Currency } from '../../shared/entities/currency.entity';
import { ExtraService } from './extra.service';
import { Extra } from '../entities/extra.entity';

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
          // Sort images by order field for public API
          if (vehicle.images && vehicle.images.length > 0) {
            vehicle.images.sort((a, b) => a.order - b.order);
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

  /**
   * Helper function to get day range based on number of days
   */
  private static getDayRange(days: number): DayRange {
    if (days >= 1 && days <= 3) return DayRange.RANGE_1_3;
    if (days >= 4 && days <= 6) return DayRange.RANGE_4_6;
    if (days >= 7 && days <= 10) return DayRange.RANGE_7_10;
    if (days >= 11 && days <= 13) return DayRange.RANGE_11_13;
    if (days >= 14 && days <= 20) return DayRange.RANGE_14_20;
    if (days >= 21 && days <= 29) return DayRange.RANGE_21_29;
    if (days >= 30) return DayRange.RANGE_30_PLUS;
    return DayRange.RANGE_1_3; // Default
  }

  /**
   * Helper function to convert currency
   * Converts price from source currency to target currency via TRY
   */
  private static async convertCurrency(
    price: number,
    sourceCurrencyCode: string,
    targetCurrencyId: string
  ): Promise<number> {
    if (sourceCurrencyCode === targetCurrencyId) return price;

    const currencyRepo = AppDataSource.getRepository(Currency);
    const sourceCurrency = await CurrencyService.getByCode(sourceCurrencyCode as any);
    const targetCurrency = await currencyRepo.findOne({ where: { id: targetCurrencyId } });

    if (!sourceCurrency || !targetCurrency) {
      return price; // Return original price if currencies not found
    }

    // Convert: sourceCurrency -> TRY -> targetCurrency
    const priceInTry = sourceCurrency.isBaseCurrency 
      ? price 
      : price * Number(sourceCurrency.rateToTry);
    
    const convertedPrice = targetCurrency.isBaseCurrency
      ? priceInTry
      : priceInTry / Number(targetCurrency.rateToTry);

    return Number(convertedPrice.toFixed(2));
  }

  /**
   * Search vehicles with pricing calculation
   * Public endpoint for site users to search available vehicles
   */
  static async searchVehicles(params: {
    tenantId: string;
    languageId?: string;
    pickupLocationId: string;
    dropoffLocationId: string;
    pickupDate: string; // YYYY-MM-DD
    dropoffDate: string; // YYYY-MM-DD
    pickupTime?: string; // HH:mm
    dropoffTime?: string; // HH:mm
    currencyId?: string;
  }): Promise<{
    vehicles: Array<{
      id: string;
      name: string;
      category?: any;
      brand?: any;
      model?: any;
      year?: number;
      transmission: string;
      fuelType: string;
      seats: number;
      luggage: number;
      doors: number;
      description?: string;
      images?: Array<{ id: string; url: string; alt?: string; isPrimary: boolean; order: number }>;
      dailyPrice: number;
      totalPrice: number;
      rentalDays: number;
      deliveryFee: number;
      dropFee: number;
      currencyCode: string;
    }>;
    extras: Array<{
      id: string;
      name: string;
      price: number;
      currencyCode: string;
      isMandatory: boolean;
      salesType: string;
      description?: string;
      imageUrl?: string;
    }>;
  }> {
    const {
      tenantId,
      pickupLocationId,
      dropoffLocationId,
      pickupDate,
      dropoffDate,
      currencyId,
    } = params;

    // Validate tenant
    const tenantRepo = AppDataSource.getRepository(Tenant);
    const tenant = await tenantRepo.findOne({ where: { id: tenantId } });
    if (!tenant || tenant.category !== TenantCategory.RENTACAR) {
      throw new Error('Invalid tenant or tenant is not a rentacar');
    }

    // Get locations from rentacar_locations table (no master location relations needed)
    const locationRepo = AppDataSource.getRepository(Location);
    
    // First, try to find locations without isActive check (to see if they exist)
    let pickupLocation = await locationRepo.findOne({
      where: { id: pickupLocationId, tenantId },
    });
    
    // If not found, check with soft-deleted included
    if (!pickupLocation) {
      pickupLocation = await locationRepo.findOne({
        where: { id: pickupLocationId, tenantId },
        withDeleted: true,
      });
    }
    
    if (!pickupLocation) {
      throw new Error(`Pickup location not found (id: ${pickupLocationId}, tenantId: ${tenantId})`);
    }
    
    // Check if location is active (warn but don't fail for search - allow inactive locations)
    if (!pickupLocation.isActive) {
      console.warn(`Pickup location is inactive (id: ${pickupLocationId})`);
    }
    
    if (pickupLocation.deletedAt) {
      throw new Error(`Pickup location is deleted (id: ${pickupLocationId})`);
    }
    
    let dropoffLocation = await locationRepo.findOne({
      where: { id: dropoffLocationId, tenantId },
    });
    
    // If not found, check with soft-deleted included
    if (!dropoffLocation) {
      dropoffLocation = await locationRepo.findOne({
        where: { id: dropoffLocationId, tenantId },
        withDeleted: true,
      });
    }
    
    if (!dropoffLocation) {
      throw new Error(`Dropoff location not found (id: ${dropoffLocationId}, tenantId: ${tenantId})`);
    }
    
    // Check if location is active (warn but don't fail for search - allow inactive locations)
    if (!dropoffLocation.isActive) {
      console.warn(`Dropoff location is inactive (id: ${dropoffLocationId})`);
    }
    
    if (dropoffLocation.deletedAt) {
      throw new Error(`Dropoff location is deleted (id: ${dropoffLocationId})`);
    }

    // Calculate rental days
    const pickup = new Date(pickupDate);
    const dropoff = new Date(dropoffDate);
    const diffTime = Math.abs(dropoff.getTime() - pickup.getTime());
    const rentalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (rentalDays < 1) {
      throw new Error('Dropoff date must be after pickup date');
    }

    // Get pickup month (1-12)
    const pickupMonth = pickup.getMonth() + 1;
    const dayRange = this.getDayRange(rentalDays);

    // Get all active vehicles for tenant
    const vehicles = await this.vehicleRepo().find({
      where: { tenantId, isActive: true },
      relations: ['category', 'brand', 'model', 'images'],
      order: { order: 'ASC', name: 'ASC' },
    });

    // Load translations for categories if needed
    const categoryIds = vehicles
      .map(v => v.categoryId)
      .filter((id): id is string => id !== null && id !== undefined);
    
    let categoryTranslationsMap = new Map<string, Translation[]>();
    if (categoryIds.length > 0 && params.languageId) {
      const translationRepo = AppDataSource.getRepository(Translation);
      const translations = await translationRepo.find({
        where: {
          model: 'VehicleCategory',
          modelId: In(categoryIds),
          languageId: params.languageId,
        },
      });
      
      translations.forEach(t => {
        if (!categoryTranslationsMap.has(t.modelId)) {
          categoryTranslationsMap.set(t.modelId, []);
        }
        categoryTranslationsMap.get(t.modelId)!.push(t);
      });
    }

    // Get default currency or specified currency
    const currencyRepo = AppDataSource.getRepository(Currency);
    let targetCurrency;
    if (currencyId) {
      targetCurrency = await currencyRepo.findOne({ where: { id: currencyId, isActive: true } });
    }
    if (!targetCurrency) {
      // Get default currency (base currency or first active)
      targetCurrency = await currencyRepo.findOne({
        where: { isBaseCurrency: true, isActive: true },
      }) || await currencyRepo.findOne({ where: { isActive: true }, order: { code: 'ASC' } });
    }
    if (!targetCurrency) {
      throw new Error('No active currency found');
    }

    // Get location pricing for all vehicles
    const pricingRepo = AppDataSource.getRepository(LocationVehiclePricing);
    const pricings = await pricingRepo.find({
      where: {
        locationId: pickupLocationId,
        month: pickupMonth,
        dayRange,
        isActive: true,
      },
    });

    // Create pricing map
    const pricingMap = new Map<string, LocationVehiclePricing>();
    pricings.forEach(p => pricingMap.set(p.vehicleId, p));

    // Get delivery and drop fees from rentacar_locations table
    let deliveryFee = Number(pickupLocation.deliveryFee || 0);
    let dropFee = Number(dropoffLocation.dropFee || 0);
    
    // Note: Parent location fees are handled at the rentacar_locations level
    // If parent location fees are needed, query them directly from rentacar_locations
    // by finding the parent location's locationId and querying rentacar_locations
    // For now, we use the direct fees from the selected locations
    
    // If pickup and dropoff are same, drop fee is 0
    if (pickupLocationId === dropoffLocationId) {
      dropFee = 0;
    }

    // Process vehicles with pricing
    const vehicleResults = [];
    for (const vehicle of vehicles) {
      // Get pricing for this vehicle
      const pricing = pricingMap.get(vehicle.id);
      let dailyPrice = Number(vehicle.baseRate || 0);
      
      if (pricing) {
        dailyPrice = Number(pricing.price);
        // Apply discount if any
        if (pricing.discount > 0) {
          dailyPrice = dailyPrice - Number(pricing.discount);
        }
      }

      // Convert prices to target currency
      const vehicleCurrencyCode = vehicle.currencyCode || 'TRY';
      const convertedDailyPrice = await this.convertCurrency(
        dailyPrice,
        vehicleCurrencyCode,
        targetCurrency.id
      );
      const convertedDeliveryFee = await this.convertCurrency(
        deliveryFee,
        'TRY', // Fees are stored in TRY
        targetCurrency.id
      );
      const convertedDropFee = await this.convertCurrency(
        dropFee,
        'TRY', // Fees are stored in TRY
        targetCurrency.id
      );

      const totalPrice = (convertedDailyPrice * rentalDays) + convertedDeliveryFee + convertedDropFee;

      // Sort images by order
      const sortedImages = vehicle.images
        ? [...vehicle.images].sort((a, b) => a.order - b.order)
        : [];

      // Get category name from translation if available
      let categoryName: string | undefined;
      if (vehicle.category && vehicle.categoryId) {
        const categoryTranslations = categoryTranslationsMap.get(vehicle.categoryId);
        if (categoryTranslations && categoryTranslations.length > 0) {
          categoryName = categoryTranslations[0].value;
        }
      }

      vehicleResults.push({
        id: vehicle.id,
        name: vehicle.name,
        category: vehicle.category ? {
          id: vehicle.category.id,
          name: categoryName || 'Category',
        } : null,
        brand: vehicle.brand ? {
          id: vehicle.brand.id,
          name: vehicle.brand.name,
        } : null,
        model: vehicle.model ? {
          id: vehicle.model.id,
          name: vehicle.model.name,
        } : null,
        year: vehicle.year,
        transmission: vehicle.transmission,
        fuelType: vehicle.fuelType,
        seats: vehicle.seats,
        luggage: vehicle.luggage,
        doors: vehicle.doors,
        description: vehicle.description,
        images: sortedImages.map(img => ({
          id: img.id,
          url: img.url,
          alt: img.alt,
          isPrimary: img.isPrimary,
          order: img.order,
        })),
        dailyPrice: convertedDailyPrice,
        totalPrice: Number(totalPrice.toFixed(2)),
        rentalDays,
        deliveryFee: convertedDeliveryFee,
        dropFee: convertedDropFee,
        currencyCode: targetCurrency.code,
      });
    }

    // Get extras for tenant
    const extras = await ExtraService.list(tenantId);
    const activeExtras = extras.filter(e => e.isActive);

    // Convert extras prices to target currency
    const extrasResults = [];
    for (const extra of activeExtras) {
      const extraCurrencyCode = extra.currencyCode || 'TRY';
      const convertedPrice = await this.convertCurrency(
        Number(extra.price),
        extraCurrencyCode,
        targetCurrency.id
      );

      extrasResults.push({
        id: extra.id,
        name: extra.name,
        price: Number(convertedPrice.toFixed(2)),
        currencyCode: targetCurrency.code,
        isMandatory: extra.isMandatory,
        salesType: extra.salesType,
        description: extra.description,
        imageUrl: extra.imageUrl,
      });
    }

    return {
      vehicles: vehicleResults,
      extras: extrasResults,
    };
  }
}
