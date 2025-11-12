import { DataSource } from 'typeorm';
import { loadEnv } from './env';
import { Tenant } from '../modules/tenants/entities/tenant.entity';
import { Destination } from '../modules/shared/entities/destination.entity';
import { Hotel } from '../modules/shared/entities/hotel.entity';
import { Blog } from '../modules/shared/entities/blog.entity';
import { PhoneCountry } from '../modules/shared/entities/phone-country.entity';
import { PaymentMethod } from '../modules/shared/entities/payment-method.entity';
import { Reservation } from '../modules/shared/entities/reservation.entity';
import { Operation } from '../modules/shared/entities/operation.entity';
import { Language } from '../modules/shared/entities/language.entity';
import { Tour } from '../modules/tour/entities/tour.entity';
import { TourSession } from '../modules/tour/entities/tour-session.entity';
import { TourFeature } from '../modules/tour/entities/tour-feature.entity';
import { TourFeatureTranslation } from '../modules/tour/entities/tour-feature-translation.entity';
import { TourTranslation } from '../modules/tour/entities/tour-translation.entity';
import { TourInfoItem } from '../modules/tour/entities/tour-info-item.entity';
import { TourImage } from '../modules/tour/entities/tour-image.entity';
import { TourTimeSlot } from '../modules/tour/entities/tour-time-slot.entity';
import { TourPricing } from '../modules/tour/entities/tour-pricing.entity';
import { Vehicle } from '../modules/rentacar/entities/vehicle.entity';
import { VehiclePlate } from '../modules/rentacar/entities/vehicle-plate.entity';
import { VehiclePricingPeriod } from '../modules/rentacar/entities/vehicle-pricing-period.entity';
import { VehicleReservationAssignment } from '../modules/rentacar/entities/vehicle-reservation-assignment.entity';
import { VehicleCategory } from '../modules/rentacar/entities/vehicle-category.entity';
import { VehicleCategoryTranslation } from '../modules/rentacar/entities/vehicle-category-translation.entity';
import { VehicleBrand } from '../modules/rentacar/entities/vehicle-brand.entity';
import { VehicleModel } from '../modules/rentacar/entities/vehicle-model.entity';
import { TenantUser } from '../modules/tenants/entities/tenant-user.entity';

const env = loadEnv();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: env.database.host,
  port: env.database.port,
  username: env.database.username,
  password: env.database.password,
  database: env.database.name,
  synchronize: env.nodeEnv !== 'production',
  logging: env.nodeEnv === 'development',
  entities: [
    Tenant,
    Destination,
    Hotel,
    Blog,
    PhoneCountry,
    PaymentMethod,
    Reservation,
    Operation,
    Language,
    Tour,
    TourSession,
    TourFeature,
    TourFeatureTranslation,
    TourTranslation,
    TourInfoItem,
    TourImage,
    TourTimeSlot,
    TourPricing,
          Vehicle,
          VehiclePlate,
          VehiclePricingPeriod,
          VehicleReservationAssignment,
          VehicleCategory,
          VehicleCategoryTranslation,
          VehicleBrand,
          VehicleModel,
          TenantUser,
  ],
  migrations: ['dist/migrations/*.js'],
});
