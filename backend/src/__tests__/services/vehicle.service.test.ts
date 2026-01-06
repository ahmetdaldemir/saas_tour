/**
 * Unit Tests for VehicleService
 */

// Mock dependencies before importing
jest.mock('../../config/data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

jest.mock('../../modules/shared/services/currency.service', () => ({
  CurrencyService: {
    getByCode: jest.fn(),
  },
}));

jest.mock('../../modules/rentacar/services/extra.service', () => ({
  ExtraService: {
    list: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('../../modules/rentacar/services/location-pricing.service', () => ({
  LocationPricingService: {},
}));

import { AppDataSource } from '../../config/data-source';
import { VehicleService, CreateVehicleInput, CreatePlateInput } from '../../modules/rentacar/services/vehicle.service';
import { TransmissionType, FuelType } from '../../modules/rentacar/entities/vehicle.entity';
import { TenantCategory } from '../../modules/tenants/entities/tenant.entity';
import { ReservationType, ReservationStatus } from '../../modules/shared/entities/reservation.entity';

describe('VehicleService', () => {
  let mockVehicleRepo: any;
  let mockPlateRepo: any;
  let mockTenantRepo: any;
  let mockCategoryRepo: any;
  let mockBrandRepo: any;
  let mockModelRepo: any;
  let mockPricingRepo: any;
  let mockAssignmentRepo: any;
  let mockReservationRepo: any;
  let mockLocationRepo: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockVehicleRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    mockPlateRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    mockTenantRepo = {
      findOne: jest.fn(),
    };

    mockCategoryRepo = {
      findOne: jest.fn(),
    };

    mockBrandRepo = {
      findOne: jest.fn(),
    };

    mockModelRepo = {
      findOne: jest.fn(),
    };

    mockPricingRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    mockAssignmentRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      })),
    };

    mockReservationRepo = {
      findOne: jest.fn(),
    };

    mockLocationRepo = {
      findOne: jest.fn(),
    };

    (AppDataSource.getRepository as jest.Mock).mockImplementation((entity: any) => {
      const entityName = entity?.name || entity;
      switch (entityName) {
        case 'Vehicle':
          return mockVehicleRepo;
        case 'VehiclePlate':
          return mockPlateRepo;
        case 'Tenant':
          return mockTenantRepo;
        case 'VehicleCategory':
          return mockCategoryRepo;
        case 'VehicleBrand':
          return mockBrandRepo;
        case 'VehicleModel':
          return mockModelRepo;
        case 'VehiclePricingPeriod':
          return mockPricingRepo;
        case 'VehicleReservationAssignment':
          return mockAssignmentRepo;
        case 'Reservation':
          return mockReservationRepo;
        case 'Location':
          return mockLocationRepo;
        default:
          return mockVehicleRepo;
      }
    });
  });

  describe('createVehicle', () => {
    const createInput: CreateVehicleInput = {
      tenantId: 'tenant-123',
      name: 'Toyota Corolla 2024',
      year: 2024,
      transmission: TransmissionType.AUTOMATIC,
      fuelType: FuelType.GASOLINE,
      seats: 5,
      doors: 4,
    };

    it('should create a vehicle successfully', async () => {
      const mockTenant = { id: 'tenant-123', category: TenantCategory.RENTACAR };
      const mockVehicle = { id: 'vehicle-123', ...createInput };

      mockTenantRepo.findOne.mockResolvedValue(mockTenant);
      mockVehicleRepo.create.mockReturnValue(mockVehicle);
      mockVehicleRepo.save.mockResolvedValue(mockVehicle);

      const result = await VehicleService.createVehicle(createInput);

      expect(mockTenantRepo.findOne).toHaveBeenCalledWith({ where: { id: 'tenant-123' } });
      expect(mockVehicleRepo.create).toHaveBeenCalled();
      expect(mockVehicleRepo.save).toHaveBeenCalled();
      expect(result).toEqual(mockVehicle);
    });

    it('should throw error when tenant not found', async () => {
      mockTenantRepo.findOne.mockResolvedValue(null);

      await expect(VehicleService.createVehicle(createInput)).rejects.toThrow('Tenant not found');
    });

    it('should throw error when tenant category is not rentacar', async () => {
      mockTenantRepo.findOne.mockResolvedValue({
        id: 'tenant-123',
        category: TenantCategory.TOUR,
      });

      await expect(VehicleService.createVehicle(createInput)).rejects.toThrow(
        'Tenant category must be rentacar'
      );
    });

    it('should create vehicle with category when categoryId provided', async () => {
      const inputWithCategory = { ...createInput, categoryId: 'cat-123' };
      const mockCategory = { id: 'cat-123', name: 'Economy' };

      mockTenantRepo.findOne.mockResolvedValue({ id: 'tenant-123', category: TenantCategory.RENTACAR });
      mockCategoryRepo.findOne.mockResolvedValue(mockCategory);
      mockVehicleRepo.create.mockImplementation((data: any) => data);
      mockVehicleRepo.save.mockImplementation((data: any) => Promise.resolve({ id: 'new-vehicle', ...data }));

      await VehicleService.createVehicle(inputWithCategory);

      expect(mockCategoryRepo.findOne).toHaveBeenCalledWith({ where: { id: 'cat-123' } });
      expect(mockVehicleRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          category: mockCategory,
          categoryId: 'cat-123',
        })
      );
    });

    it('should throw error when category not found', async () => {
      const inputWithCategory = { ...createInput, categoryId: 'nonexistent-cat' };

      mockTenantRepo.findOne.mockResolvedValue({ id: 'tenant-123', category: TenantCategory.RENTACAR });
      mockCategoryRepo.findOne.mockResolvedValue(null);

      await expect(VehicleService.createVehicle(inputWithCategory)).rejects.toThrow(
        'Vehicle category not found'
      );
    });

    it('should set default values for vehicle properties', async () => {
      const minimalInput: CreateVehicleInput = {
        tenantId: 'tenant-123',
        name: 'Basic Car',
      };

      mockTenantRepo.findOne.mockResolvedValue({ id: 'tenant-123', category: TenantCategory.RENTACAR });
      mockVehicleRepo.create.mockImplementation((data: any) => data);
      mockVehicleRepo.save.mockImplementation((data: any) => Promise.resolve({ id: 'new-vehicle', ...data }));

      await VehicleService.createVehicle(minimalInput);

      expect(mockVehicleRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          transmission: TransmissionType.AUTOMATIC,
          fuelType: FuelType.GASOLINE,
          seats: 4,
          luggage: 2,
          doors: 4,
          baseRate: 0,
          currencyCode: 'EUR',
        })
      );
    });
  });

  describe('addPlate', () => {
    const plateInput: CreatePlateInput = {
      vehicleId: 'vehicle-123',
      plateNumber: '34 ABC 123',
      km: 50000,
    };

    it('should add plate successfully', async () => {
      const mockVehicle = { id: 'vehicle-123' };
      const mockPlate = { id: 'plate-123', ...plateInput };

      mockVehicleRepo.findOne.mockResolvedValue(mockVehicle);
      mockPlateRepo.findOne.mockResolvedValue(null);
      mockPlateRepo.create.mockReturnValue(mockPlate);
      mockPlateRepo.save.mockResolvedValue(mockPlate);

      const result = await VehicleService.addPlate(plateInput);

      expect(result).toEqual(mockPlate);
    });

    it('should throw error when vehicle not found', async () => {
      mockVehicleRepo.findOne.mockResolvedValue(null);

      await expect(VehicleService.addPlate(plateInput)).rejects.toThrow('Vehicle not found');
    });

    it('should throw error when plate already exists', async () => {
      mockVehicleRepo.findOne.mockResolvedValue({ id: 'vehicle-123' });
      mockPlateRepo.findOne.mockResolvedValue({ id: 'existing-plate', plateNumber: '34 ABC 123' });

      await expect(VehicleService.addPlate(plateInput)).rejects.toThrow('Plate already assigned');
    });
  });

  describe('updatePlate', () => {
    it('should update plate successfully', async () => {
      const existingPlate = {
        id: 'plate-123',
        plateNumber: '34 ABC 123',
        km: 50000,
      };

      mockPlateRepo.findOne.mockResolvedValue(existingPlate);
      mockPlateRepo.save.mockImplementation((data: any) => Promise.resolve(data));

      const result = await VehicleService.updatePlate('plate-123', { km: 55000 });

      expect(result.km).toBe(55000);
    });

    it('should throw error when plate not found', async () => {
      mockPlateRepo.findOne.mockResolvedValue(null);

      await expect(
        VehicleService.updatePlate('nonexistent', { km: 55000 })
      ).rejects.toThrow('Plate not found');
    });

    it('should throw error when changing to existing plate number', async () => {
      mockPlateRepo.findOne
        .mockResolvedValueOnce({ id: 'plate-123', plateNumber: '34 ABC 123' })
        .mockResolvedValueOnce({ id: 'other-plate', plateNumber: '34 XYZ 999' });

      await expect(
        VehicleService.updatePlate('plate-123', { plateNumber: '34 XYZ 999' })
      ).rejects.toThrow('Plate number already assigned to another vehicle');
    });
  });

  describe('removePlate', () => {
    it('should remove plate successfully', async () => {
      const existingPlate = { id: 'plate-123' };

      mockPlateRepo.findOne.mockResolvedValue(existingPlate);
      mockPlateRepo.remove.mockResolvedValue(existingPlate);

      await VehicleService.removePlate('plate-123');

      expect(mockPlateRepo.remove).toHaveBeenCalledWith(existingPlate);
    });

    it('should throw error when plate not found', async () => {
      mockPlateRepo.findOne.mockResolvedValue(null);

      await expect(VehicleService.removePlate('nonexistent')).rejects.toThrow('Plate not found');
    });
  });

  describe('upsertPricing', () => {
    it('should create new pricing when not exists', async () => {
      const mockVehicle = { id: 'vehicle-123' };

      mockVehicleRepo.findOne.mockResolvedValue(mockVehicle);
      mockPricingRepo.findOne.mockResolvedValue(null);
      mockPricingRepo.create.mockImplementation((data: any) => data);
      mockPricingRepo.save.mockImplementation((data: any) => Promise.resolve({ id: 'pricing-123', ...data }));

      const result = await VehicleService.upsertPricing({
        vehicleId: 'vehicle-123',
        season: 'high' as any,
        month: 7,
        dailyRate: 100,
      });

      expect(mockPricingRepo.create).toHaveBeenCalled();
      expect(result.dailyRate).toBe(100);
    });

    it('should update existing pricing', async () => {
      const existingPricing = {
        id: 'pricing-123',
        vehicleId: 'vehicle-123',
        season: 'low',
        month: 7,
        dailyRate: 80,
      };

      mockVehicleRepo.findOne.mockResolvedValue({ id: 'vehicle-123' });
      mockPricingRepo.findOne.mockResolvedValue(existingPricing);
      mockPricingRepo.save.mockImplementation((data: any) => Promise.resolve(data));

      const result = await VehicleService.upsertPricing({
        vehicleId: 'vehicle-123',
        season: 'high' as any,
        month: 7,
        dailyRate: 120,
      });

      expect(result.dailyRate).toBe(120);
      expect(result.season).toBe('high');
    });

    it('should throw error for invalid month', async () => {
      await expect(
        VehicleService.upsertPricing({
          vehicleId: 'vehicle-123',
          season: 'high' as any,
          month: 13,
          dailyRate: 100,
        })
      ).rejects.toThrow('Month must be between 1 and 12');
    });

    it('should throw error when vehicle not found', async () => {
      mockVehicleRepo.findOne.mockResolvedValue(null);

      await expect(
        VehicleService.upsertPricing({
          vehicleId: 'nonexistent',
          season: 'high' as any,
          month: 7,
          dailyRate: 100,
        })
      ).rejects.toThrow('Vehicle not found');
    });
  });

  describe('assignPlate', () => {
    const assignInput = {
      reservationId: 'reservation-123',
      plateId: 'plate-123',
      startDate: '2024-07-01',
      endDate: '2024-07-07',
    };

    it('should assign plate successfully', async () => {
      const mockReservation = {
        id: 'reservation-123',
        type: ReservationType.RENTACAR,
        status: ReservationStatus.CONFIRMED,
        tenantId: 'tenant-123',
      };
      const mockPlate = {
        id: 'plate-123',
        vehicle: { id: 'vehicle-123', tenantId: 'tenant-123' },
      };

      mockReservationRepo.findOne.mockResolvedValue(mockReservation);
      mockPlateRepo.findOne.mockResolvedValue(mockPlate);
      mockAssignmentRepo.findOne.mockResolvedValue(null);
      mockAssignmentRepo.create.mockImplementation((data: any) => data);
      mockAssignmentRepo.save.mockImplementation((data: any) => Promise.resolve({ id: 'assignment-123', ...data }));

      const result = await VehicleService.assignPlate(assignInput);

      expect(result).toBeDefined();
    });

    it('should throw error when reservation not found', async () => {
      mockReservationRepo.findOne.mockResolvedValue(null);

      await expect(VehicleService.assignPlate(assignInput)).rejects.toThrow('Reservation not found');
    });

    it('should throw error for non-rentacar reservation', async () => {
      mockReservationRepo.findOne.mockResolvedValue({
        id: 'reservation-123',
        type: ReservationType.TOUR,
      });

      await expect(VehicleService.assignPlate(assignInput)).rejects.toThrow(
        'Reservation type must be rentacar'
      );
    });

    it('should throw error for invalid reservation status', async () => {
      mockReservationRepo.findOne.mockResolvedValue({
        id: 'reservation-123',
        type: ReservationType.RENTACAR,
        status: ReservationStatus.CANCELLED,
      });

      await expect(VehicleService.assignPlate(assignInput)).rejects.toThrow(
        'Reservation must be pending or confirmed to assign a plate'
      );
    });

    it('should throw error when plate not found', async () => {
      mockReservationRepo.findOne.mockResolvedValue({
        id: 'reservation-123',
        type: ReservationType.RENTACAR,
        status: ReservationStatus.CONFIRMED,
      });
      mockPlateRepo.findOne.mockResolvedValue(null);

      await expect(VehicleService.assignPlate(assignInput)).rejects.toThrow('Plate not found');
    });

    it('should throw error for invalid date range', async () => {
      mockReservationRepo.findOne.mockResolvedValue({
        id: 'reservation-123',
        type: ReservationType.RENTACAR,
        status: ReservationStatus.CONFIRMED,
      });
      mockPlateRepo.findOne.mockResolvedValue({
        id: 'plate-123',
        vehicle: { id: 'vehicle-123', tenantId: 'tenant-123' },
      });

      await expect(
        VehicleService.assignPlate({
          ...assignInput,
          startDate: '2024-07-10',
          endDate: '2024-07-05', // End before start
        })
      ).rejects.toThrow('Start date must be before end date');
    });

    it('should throw error when tenants mismatch', async () => {
      mockReservationRepo.findOne.mockResolvedValue({
        id: 'reservation-123',
        type: ReservationType.RENTACAR,
        status: ReservationStatus.CONFIRMED,
        tenantId: 'tenant-123',
      });
      mockPlateRepo.findOne.mockResolvedValue({
        id: 'plate-123',
        vehicle: { id: 'vehicle-123', tenantId: 'different-tenant' },
      });

      await expect(VehicleService.assignPlate(assignInput)).rejects.toThrow(
        'Reservation and plate belong to different tenants'
      );
    });
  });

  describe('listVehicles', () => {
    it('should list all vehicles for a tenant', async () => {
      const mockVehicles = [
        { id: 'vehicle-1', tenantId: 'tenant-123', name: 'Car 1', categoryId: null },
        { id: 'vehicle-2', tenantId: 'tenant-123', name: 'Car 2', categoryId: null },
      ];

      mockVehicleRepo.find.mockResolvedValue(mockVehicles);

      const result = await VehicleService.listVehicles('tenant-123');

      expect(mockVehicleRepo.find).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-123' },
        relations: ['category', 'brand', 'model', 'plates', 'pricingPeriods', 'lastReturnLocation', 'images'],
        order: { order: 'ASC', createdAt: 'DESC' },
      });
      expect(result).toEqual(mockVehicles);
    });
  });

  describe('updateVehicle', () => {
    it('should update vehicle successfully', async () => {
      const existingVehicle = {
        id: 'vehicle-123',
        name: 'Old Name',
        year: 2023,
      };

      mockVehicleRepo.findOne.mockResolvedValue(existingVehicle);
      mockVehicleRepo.save.mockImplementation((data: any) => Promise.resolve(data));

      const result = await VehicleService.updateVehicle('vehicle-123', {
        name: 'New Name',
        year: 2024,
      });

      expect(result.name).toBe('New Name');
      expect(result.year).toBe(2024);
    });

    it('should throw error when vehicle not found', async () => {
      mockVehicleRepo.findOne.mockResolvedValue(null);

      await expect(
        VehicleService.updateVehicle('nonexistent', { name: 'Test' })
      ).rejects.toThrow('Vehicle not found');
    });
  });

  describe('updateLastReturnLocation', () => {
    it('should update last return location', async () => {
      const mockVehicle = {
        id: 'vehicle-123',
        tenantId: 'tenant-123',
      };
      const mockLocation = {
        id: 'location-123',
        tenantId: 'tenant-123',
      };

      mockVehicleRepo.findOne.mockResolvedValue(mockVehicle);
      mockLocationRepo.findOne.mockResolvedValue(mockLocation);
      mockVehicleRepo.save.mockImplementation((data: any) => Promise.resolve(data));

      const result = await VehicleService.updateLastReturnLocation('vehicle-123', 'location-123');

      expect(result.lastReturnLocation).toEqual(mockLocation);
      expect(result.lastReturnLocationId).toBe('location-123');
    });

    it('should clear last return location when null', async () => {
      const mockVehicle = {
        id: 'vehicle-123',
        tenantId: 'tenant-123',
        lastReturnLocation: { id: 'old-location' },
        lastReturnLocationId: 'old-location',
      };

      mockVehicleRepo.findOne.mockResolvedValue(mockVehicle);
      mockVehicleRepo.save.mockImplementation((data: any) => Promise.resolve(data));

      const result = await VehicleService.updateLastReturnLocation('vehicle-123', null);

      expect(result.lastReturnLocation).toBeNull();
      expect(result.lastReturnLocationId).toBeNull();
    });

    it('should throw error when vehicle not found', async () => {
      mockVehicleRepo.findOne.mockResolvedValue(null);

      await expect(
        VehicleService.updateLastReturnLocation('nonexistent', 'location-123')
      ).rejects.toThrow('Vehicle not found');
    });

    it('should throw error when location not found', async () => {
      mockVehicleRepo.findOne.mockResolvedValue({ id: 'vehicle-123' });
      mockLocationRepo.findOne.mockResolvedValue(null);

      await expect(
        VehicleService.updateLastReturnLocation('vehicle-123', 'nonexistent')
      ).rejects.toThrow('Location not found');
    });

    it('should throw error when tenants mismatch', async () => {
      mockVehicleRepo.findOne.mockResolvedValue({
        id: 'vehicle-123',
        tenantId: 'tenant-123',
      });
      mockLocationRepo.findOne.mockResolvedValue({
        id: 'location-123',
        tenantId: 'different-tenant',
      });

      await expect(
        VehicleService.updateLastReturnLocation('vehicle-123', 'location-123')
      ).rejects.toThrow('Location and vehicle belong to different tenants');
    });
  });
});

