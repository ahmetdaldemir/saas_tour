import { Repository, In } from 'typeorm';
import { AppDataSource } from '../../../config/data-source';
import { Reservation, ReservationStatus, ReservationType } from '../../shared/entities/reservation.entity';
import { Vehicle } from '../entities/vehicle.entity';
import { Location } from '../entities/location.entity';
import { Extra } from '../entities/extra.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { TenantUser, TenantUserRole } from '../../tenants/entities/tenant-user.entity';
import { TenantUserService } from '../../tenants/services/tenant-user.service';
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
   * Find or create user by email
   */
  private static async findOrCreateUser(
    tenantId: string,
    email: string,
    firstName: string,
    lastName: string
  ): Promise<{ user: TenantUser | null; password: string | null }> {
    // Check if user exists
    const existingUser = await this.tenantUserRepo().findOne({
      where: { email },
    });

    if (existingUser) {
      return { user: existingUser, password: null };
    }

    // Create new user with random password
    const randomPassword = this.generateRandomPassword();
    
    try {
      const newUser = await TenantUserService.create({
        tenantId,
        name: `${firstName} ${lastName}`,
        email,
        password: randomPassword,
        role: TenantUserRole.VIEWER, // Customer role
      });

      // Send password email
      try {
        const passwordEmailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Your Account Created</title>
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f4f4f4; padding: 20px; border-radius: 5px;">
              <h2 style="color: #2c3e50;">Welcome ${firstName} ${lastName}!</h2>
              <p>Your account has been created. Here are your login credentials:</p>
              <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Password:</strong> <code style="background-color: #f4f4f4; padding: 5px 10px; border-radius: 3px; font-size: 14px;">${randomPassword}</code></p>
              </div>
              <p style="color: #e74c3c;"><strong>Important:</strong> Please change your password after first login for security.</p>
              <p>Thank you for your reservation!</p>
            </div>
          </body>
          </html>
        `;

        await sendMail({
          tenantId,
          to: email,
          subject: 'Your Account Credentials',
          html: passwordEmailHtml,
        });
      } catch (error) {
        console.error('Failed to send password email:', error);
        // Continue even if email fails
      }

      return { user: newUser, password: randomPassword };
    } catch (error) {
      console.error('Failed to create user:', error);
      // Continue without user creation if it fails
      return { user: null, password: null };
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

    // Find or create user
    const { user } = await this.findOrCreateUser(
      input.tenantId,
      input.personalInfo.email,
      input.personalInfo.firstName,
      input.personalInfo.lastName
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
      customerUserId: user?.id || null,
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
}

