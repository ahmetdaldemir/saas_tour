import { Repository, In } from 'typeorm';
import { AppDataSource } from '../../../config/data-source';
import { Reservation, ReservationStatus, ReservationType } from '../../shared/entities/reservation.entity';
import { Vehicle } from '../entities/vehicle.entity';
import { Location } from '../entities/location.entity';
import { Extra } from '../entities/extra.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { TenantUser, TenantUserRole } from '../../tenants/entities/tenant-user.entity';
import { TenantUserService } from '../../tenants/services/tenant-user.service';
import { Customer, CustomerIdType } from '../../shared/entities/customer.entity';
import { CustomerService } from '../../shared/services/customer.service';
import { sendReservationEmail } from '../../../services/reservation-email.service';
import { EmailTemplateType } from '../../shared/entities/email-template.entity';
import { sendMail } from '../../../services/mail.service';
import crypto from 'crypto';

export type CreateRentacarReservationInput = {
  tenantId: string;
  vehicleId: string;
  pickupLocationId: string;
  dropoffLocationId: string;
  pickupDate: string;
  dropoffDate: string;
  pickupTime: string;
  dropoffTime: string;
  rentalDays: number;
  extras: Array<{
    id: string;
    quantity: number;
  }>;
  vehiclePrice: number;
  extrasPrice: number;
  totalPrice: number;
  currencyCode: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    nationality: string;
    identityNumber: string;
    dateOfBirth: string;
    phoneCountryCode: string;
    phoneNumber: string;
    email: string;
  };
  driverLicenseInfo: {
    licenseNumber: string;
    licenseIssueDate: string;
    licenseExpiryDate: string;
    licenseCountry: string;
  };
  addressInfo: {
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  paymentMethod: string;
  personalDataConsent: boolean;
  commercialElectronicConsent: boolean;
  rentalConditionsConsent: boolean;
};

export class RentacarReservationService {
  private static reservationRepo(): Repository<Reservation> {
    return AppDataSource.getRepository(Reservation);
  }

  private static vehicleRepo(): Repository<Vehicle> {
    return AppDataSource.getRepository(Vehicle);
  }

  private static locationRepo(): Repository<Location> {
    return AppDataSource.getRepository(Location);
  }

  private static extraRepo(): Repository<Extra> {
    return AppDataSource.getRepository(Extra);
  }

  private static tenantRepo(): Repository<Tenant> {
    return AppDataSource.getRepository(Tenant);
  }

  private static tenantUserRepo(): Repository<TenantUser> {
    return AppDataSource.getRepository(TenantUser);
  }

  /**
   * Generate unique reservation reference
   */
  private static generateReference(): string {
    const prefix = 'RAC';
    const random = crypto.randomBytes(4).toString('hex').toUpperCase();
    const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * Generate random password
   */
  private static generateRandomPassword(): string {
    return crypto.randomBytes(12).toString('base64').slice(0, 16);
  }

  /**
   * Find or create customer by email
   */
  private static async findOrCreateCustomer(
    tenantId: string,
    email: string,
    firstName: string,
    lastName: string,
    personalInfo: CreateRentacarReservationInput['personalInfo'],
    driverLicenseInfo?: CreateRentacarReservationInput['driverLicenseInfo'],
    addressInfo?: CreateRentacarReservationInput['addressInfo']
  ): Promise<{ customer: Customer | null }> {
    // Check if customer exists by email
    const customerRepo = AppDataSource.getRepository(Customer);
    const existingCustomer = await customerRepo.findOne({
      where: { email, tenantId },
    });

    if (existingCustomer) {
      return { customer: existingCustomer };
    }

    // Create new customer
    try {
      const newCustomer = await CustomerService.create({
        tenantId,
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`,
        email,
        mobilePhone: personalInfo.phoneNumber ? `${personalInfo.phoneCountryCode}${personalInfo.phoneNumber}` : undefined,
        birthDate: personalInfo.dateOfBirth ? new Date(personalInfo.dateOfBirth) : undefined,
        country: personalInfo.nationality,
        idNumber: personalInfo.identityNumber,
        idType: personalInfo.identityNumber ? (personalInfo.identityNumber.length === 11 ? CustomerIdType.TC : CustomerIdType.PASSPORT) : undefined,
        licenseNumber: driverLicenseInfo?.licenseNumber,
        licenseIssueDate: driverLicenseInfo?.licenseIssueDate ? new Date(driverLicenseInfo.licenseIssueDate) : undefined,
        homeAddress: addressInfo?.address,
        isActive: true,
        isBlacklisted: false,
      });

      return { customer: newCustomer };
    } catch (error) {
      console.error('Failed to create customer:', error);
      // Continue without customer creation if it fails
      return { customer: null };
    }
  }

  /**
   * Create rentacar reservation
   */
  static async create(input: CreateRentacarReservationInput): Promise<Reservation> {
    // Validate tenant
    const tenant = await this.tenantRepo().findOne({ where: { id: input.tenantId } });
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // Validate vehicle
    const vehicle = await this.vehicleRepo().findOne({
      where: { id: input.vehicleId, tenantId: input.tenantId },
      relations: ['category', 'brand', 'model'],
    });
    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    // Validate locations
    // Try to find pickup location by rentacar_locations.id first
    let pickupLocation = await this.locationRepo().findOne({
      where: { id: input.pickupLocationId, tenantId: input.tenantId },
      relations: ['location'],
    });
    
    // If not found, try to find by master location ID (locationId)
    if (!pickupLocation) {
      pickupLocation = await this.locationRepo().findOne({
        where: { locationId: input.pickupLocationId, tenantId: input.tenantId },
        relations: ['location'],
      });
    }
    
    // If still not found, check with soft-deleted included (by id)
    if (!pickupLocation) {
      pickupLocation = await this.locationRepo().findOne({
        where: { id: input.pickupLocationId, tenantId: input.tenantId },
        relations: ['location'],
        withDeleted: true,
      });
    }
    
    // If still not found, check with soft-deleted included (by locationId)
    if (!pickupLocation) {
      pickupLocation = await this.locationRepo().findOne({
        where: { locationId: input.pickupLocationId, tenantId: input.tenantId },
        relations: ['location'],
        withDeleted: true,
      });
    }
    
    if (!pickupLocation) {
      throw new Error(`Pickup location not found for tenant ${input.tenantId}. Searched by id: ${input.pickupLocationId} and locationId: ${input.pickupLocationId}. Make sure the location exists in rentacar_locations table for this tenant.`);
    }
    
    if (pickupLocation.deletedAt) {
      throw new Error(`Pickup location is deleted (id: ${pickupLocation.id})`);
    }

    // Try to find dropoff location by rentacar_locations.id first
    let dropoffLocation = await this.locationRepo().findOne({
      where: { id: input.dropoffLocationId, tenantId: input.tenantId },
      relations: ['location'],
    });
    
    // If not found, try to find by master location ID (locationId)
    if (!dropoffLocation) {
      dropoffLocation = await this.locationRepo().findOne({
        where: { locationId: input.dropoffLocationId, tenantId: input.tenantId },
        relations: ['location'],
      });
    }
    
    // If still not found, check with soft-deleted included (by id)
    if (!dropoffLocation) {
      dropoffLocation = await this.locationRepo().findOne({
        where: { id: input.dropoffLocationId, tenantId: input.tenantId },
        relations: ['location'],
        withDeleted: true,
      });
    }
    
    // If still not found, check with soft-deleted included (by locationId)
    if (!dropoffLocation) {
      dropoffLocation = await this.locationRepo().findOne({
        where: { locationId: input.dropoffLocationId, tenantId: input.tenantId },
        relations: ['location'],
        withDeleted: true,
      });
    }
    
    if (!dropoffLocation) {
      throw new Error(`Dropoff location not found for tenant ${input.tenantId}. Searched by id: ${input.dropoffLocationId} and locationId: ${input.dropoffLocationId}. Make sure the location exists in rentacar_locations table for this tenant.`);
    }
    
    if (dropoffLocation.deletedAt) {
      throw new Error(`Dropoff location is deleted (id: ${dropoffLocation.id})`);
    }

    // Validate extras
    const extraIds = input.extras.map(e => e.id);
    const extras = await this.extraRepo().find({
      where: { 
        id: In(extraIds), 
        tenantId: input.tenantId 
      },
    });
    if (extras.length !== extraIds.length) {
      throw new Error(`Some extras not found. Requested: ${extraIds.length}, Found: ${extras.length}`);
    }

    // Find or create customer by email
    const { customer } = await this.findOrCreateCustomer(
      input.tenantId,
      input.personalInfo.email,
      input.personalInfo.firstName,
      input.personalInfo.lastName,
      input.personalInfo,
      input.driverLicenseInfo,
      input.addressInfo
    );

    // Generate reference
    const reference = this.generateReference();

    // Prepare pickup and dropoff dates with times
    const [pickupHours, pickupMinutes] = input.pickupTime.split(':').map(Number);
    const [dropoffHours, dropoffMinutes] = input.dropoffTime.split(':').map(Number);
    
    const pickupDate = new Date(input.pickupDate);
    pickupDate.setHours(pickupHours, pickupMinutes, 0, 0);
    
    const dropoffDate = new Date(input.dropoffDate);
    dropoffDate.setHours(dropoffHours, dropoffMinutes, 0, 0);

    // Create reservation metadata
    const metadata = {
      vehicleId: input.vehicleId,
      vehicleName: vehicle.name,
      pickupLocationId: input.pickupLocationId,
      pickupLocationName: pickupLocation.location?.name || 'Unknown',
      dropoffLocationId: input.dropoffLocationId,
      dropoffLocationName: dropoffLocation.location?.name || 'Unknown',
      rentalDays: input.rentalDays,
      extras: input.extras.map(extra => {
        const extraData = extras.find(e => e.id === extra.id);
        return {
          id: extra.id,
          name: extraData?.name || 'Unknown',
          quantity: extra.quantity,
          price: extraData?.price || 0,
        };
      }),
      vehiclePrice: input.vehiclePrice,
      extrasPrice: input.extrasPrice,
      totalPrice: input.totalPrice,
      currencyCode: input.currencyCode,
      paymentMethod: input.paymentMethod,
      personalInfo: input.personalInfo,
      driverLicenseInfo: input.driverLicenseInfo,
      addressInfo: input.addressInfo,
      personalDataConsent: input.personalDataConsent,
      commercialElectronicConsent: input.commercialElectronicConsent,
      rentalConditionsConsent: input.rentalConditionsConsent,
      customerId: customer?.id || null,
    };

    // Create reservation
    const reservation = this.reservationRepo().create({
      tenantId: input.tenantId,
      reference,
      type: ReservationType.RENTACAR,
      status: ReservationStatus.PENDING,
      customerName: `${input.personalInfo.firstName} ${input.personalInfo.lastName}`,
      customerEmail: input.personalInfo.email,
      customerPhone: `${input.personalInfo.phoneCountryCode}${input.personalInfo.phoneNumber}`,
      checkIn: pickupDate,
      checkOut: dropoffDate,
      metadata,
    });

    const savedReservation = await this.reservationRepo().save(reservation);

    // Send confirmation email (async, don't wait)
    sendReservationEmail(savedReservation, EmailTemplateType.RESERVATION_CONFIRMATION).catch(
      (error) => {
        console.error(`Error sending confirmation email for reservation ${savedReservation.id}:`, error);
      }
    );

    return savedReservation;
  }

  /**
   * Update rentacar reservation with price recalculation
   */
  static async updateReservation(
    id: string,
    tenantId: string,
    input: Partial<CreateRentacarReservationInput> & { recalculatePrice?: boolean }
  ): Promise<Reservation> {
    const reservation = await this.reservationRepo().findOne({
      where: { id, tenantId },
      relations: ['customerLanguage'],
    });

    if (!reservation) {
      throw new Error('Reservation not found');
    }

    if (reservation.type !== ReservationType.RENTACAR) {
      throw new Error('Reservation is not a rentacar reservation');
    }

    // If recalculatePrice is true, recalculate all prices
    if (input.recalculatePrice) {
      // Get current metadata or use input data
      const currentMetadata = reservation.metadata as any;
      const vehicleId = input.vehicleId || currentMetadata?.vehicleId;
      const pickupLocationId = input.pickupLocationId || currentMetadata?.pickupLocationId;
      const dropoffLocationId = input.dropoffLocationId || currentMetadata?.dropoffLocationId;
      const pickupDate = input.pickupDate || (reservation.checkIn ? new Date(reservation.checkIn).toISOString().split('T')[0] : '');
      const dropoffDate = input.dropoffDate || (reservation.checkOut ? new Date(reservation.checkOut).toISOString().split('T')[0] : '');
      const pickupTime = input.pickupTime || (reservation.checkIn ? `${String(new Date(reservation.checkIn).getHours()).padStart(2, '0')}:${String(new Date(reservation.checkIn).getMinutes()).padStart(2, '0')}` : '09:00');
      const dropoffTime = input.dropoffTime || (reservation.checkOut ? `${String(new Date(reservation.checkOut).getHours()).padStart(2, '0')}:${String(new Date(reservation.checkOut).getMinutes()).padStart(2, '0')}` : '09:00');
      const currencyCode = input.currencyCode || currentMetadata?.currencyCode || 'TRY';

      if (!vehicleId || !pickupLocationId || !dropoffLocationId || !pickupDate || !dropoffDate) {
        throw new Error('Missing required fields for price recalculation');
      }

      // Use VehicleService to search and get pricing
      const { VehicleService } = await import('./vehicle.service');
      const searchResult = await VehicleService.searchVehicles({
        tenantId,
        pickupLocationId,
        dropoffLocationId,
        pickupDate,
        dropoffDate,
        pickupTime,
        dropoffTime,
      });

      const vehicle = searchResult.vehicles.find(v => v.id === vehicleId);
      if (!vehicle) {
        throw new Error('Vehicle not found or not available for the selected dates');
      }

      // Calculate rental days
      const pickup = new Date(pickupDate);
      const dropoff = new Date(dropoffDate);
      const rentalDays = Math.ceil((dropoff.getTime() - pickup.getTime()) / (1000 * 60 * 60 * 24));

      // Calculate extras price
      const extraIds = input.extras?.map(e => e.id) || currentMetadata?.extras?.map((e: any) => e.id) || [];
      const extras = await this.extraRepo().find({
        where: { id: In(extraIds), tenantId },
      });

      let extrasPrice = 0;
      extras.forEach(extra => {
        const quantity = input.extras?.find(e => e.id === extra.id)?.quantity || 
                        currentMetadata?.extras?.find((e: any) => e.id === extra.id)?.quantity || 1;
        const salesType = extra.salesType?.toLowerCase() || 'per_rental';
        if (salesType === 'daily') {
          extrasPrice += Number(extra.price) * rentalDays * quantity;
        } else {
          extrasPrice += Number(extra.price) * quantity;
        }
      });

      // Get delivery and drop fees from locations
      const pickupLocation = await this.locationRepo().findOne({
        where: { id: pickupLocationId, tenantId },
        relations: ['location'],
      });
      const dropoffLocation = await this.locationRepo().findOne({
        where: { id: dropoffLocationId, tenantId },
        relations: ['location'],
      });

      let deliveryFee = 0;
      let dropFee = 0;

      if (pickupLocation) {
        // Check if master location has a parent
        if (pickupLocation.location?.parentId) {
          // Find rentacar location by master location parent ID
          const parentRentacarLocation = await this.locationRepo().findOne({
            where: { locationId: pickupLocation.location.parentId, tenantId },
            relations: ['location'],
          });
          deliveryFee = Number(parentRentacarLocation?.deliveryFee || 0);
        } else {
          deliveryFee = Number(pickupLocation.deliveryFee || 0);
        }
      }

      if (dropoffLocation && pickupLocationId !== dropoffLocationId) {
        // Check if master location has a parent
        if (dropoffLocation.location?.parentId) {
          // Find rentacar location by master location parent ID
          const parentRentacarLocation = await this.locationRepo().findOne({
            where: { locationId: dropoffLocation.location.parentId, tenantId },
            relations: ['location'],
          });
          dropFee = Number(parentRentacarLocation?.dropFee || 0);
        } else {
          dropFee = Number(dropoffLocation.dropFee || 0);
        }
      }

      // Calculate total price
      const vehiclePrice = vehicle.totalPrice;
      const totalPrice = vehiclePrice + extrasPrice + deliveryFee + dropFee;

      // Update metadata with new prices
      const updatedMetadata = {
        ...currentMetadata,
        vehicleId,
        vehicleName: vehicle.name,
        pickupLocationId,
        pickupLocationName: pickupLocation?.location?.name || currentMetadata?.pickupLocationName,
        dropoffLocationId,
        dropoffLocationName: dropoffLocation?.location?.name || currentMetadata?.dropoffLocationName,
        rentalDays,
        extras: extras.map(extra => {
          const quantity = input.extras?.find(e => e.id === extra.id)?.quantity || 
                          currentMetadata?.extras?.find((e: any) => e.id === extra.id)?.quantity || 1;
          return {
            id: extra.id,
            name: extra.name,
            quantity,
            price: extra.price,
          };
        }),
        vehiclePrice,
        extrasPrice,
        totalPrice,
        currencyCode,
        deliveryFee,
        dropFee,
        dailyPrice: vehicle.dailyPrice,
        source: (input as any).source || currentMetadata?.source,
      };

      // Update checkIn and checkOut dates
      const [pickupHours, pickupMinutes] = pickupTime.split(':').map(Number);
      const [dropoffHours, dropoffMinutes] = dropoffTime.split(':').map(Number);
      
      const pickupDateTime = new Date(pickupDate);
      pickupDateTime.setHours(pickupHours, pickupMinutes, 0, 0);
      
      const dropoffDateTime = new Date(dropoffDate);
      dropoffDateTime.setHours(dropoffHours, dropoffMinutes, 0, 0);

      reservation.metadata = updatedMetadata;
      reservation.checkIn = pickupDateTime;
      reservation.checkOut = dropoffDateTime;

      // Update other fields if provided
      if (input.paymentMethod) {
        (updatedMetadata as any).paymentMethod = input.paymentMethod;
      }
    } else {
      // Normal update without price recalculation
      if (input.pickupDate && input.pickupTime) {
        const [hours, minutes] = input.pickupTime.split(':').map(Number);
        const pickupDate = new Date(input.pickupDate);
        pickupDate.setHours(hours, minutes, 0, 0);
        reservation.checkIn = pickupDate;
      }
      if (input.dropoffDate && input.dropoffTime) {
        const [hours, minutes] = input.dropoffTime.split(':').map(Number);
        const dropoffDate = new Date(input.dropoffDate);
        dropoffDate.setHours(hours, minutes, 0, 0);
        reservation.checkOut = dropoffDate;
      }
      if ((input as any).metadata) {
        reservation.metadata = { ...(reservation.metadata as any), ...(input as any).metadata };
      }
    }

    return this.reservationRepo().save(reservation);
  }
}

