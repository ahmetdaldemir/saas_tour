import { DataSource } from 'typeorm';
import { loadEnv } from './env';
import { Tenant } from '../modules/tenants/entities/tenant.entity';
import { Destination } from '../modules/shared/entities/destination.entity';
import { Translation } from '../modules/shared/entities/translation.entity';
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
import { TourInfoItem } from '../modules/tour/entities/tour-info-item.entity';
import { TourImage } from '../modules/tour/entities/tour-image.entity';
import { TourTimeSlot } from '../modules/tour/entities/tour-time-slot.entity';
import { TourPricing } from '../modules/tour/entities/tour-pricing.entity';
import { Vehicle } from '../modules/rentacar/entities/vehicle.entity';
import { VehiclePlate } from '../modules/rentacar/entities/vehicle-plate.entity';
import { VehiclePricingPeriod } from '../modules/rentacar/entities/vehicle-pricing-period.entity';
import { VehicleReservationAssignment } from '../modules/rentacar/entities/vehicle-reservation-assignment.entity';
import { VehicleCategory } from '../modules/rentacar/entities/vehicle-category.entity';
import { VehicleBrand } from '../modules/rentacar/entities/vehicle-brand.entity';
import { VehicleModel } from '../modules/rentacar/entities/vehicle-model.entity';
import { Location } from '../modules/rentacar/entities/location.entity';
import { LocationVehiclePricing } from '../modules/rentacar/entities/location-vehicle-pricing.entity';
import { LocationDeliveryPricing } from '../modules/rentacar/entities/location-delivery-pricing.entity';
import { Extra } from '../modules/rentacar/entities/extra.entity';
import { TenantUser } from '../modules/tenants/entities/tenant-user.entity';
import { Currency } from '../modules/shared/entities/currency.entity';
import { TenantSettings } from '../modules/shared/entities/tenant-settings.entity';
import { Survey } from '../modules/shared/entities/survey.entity';
import { SurveyQuestion } from '../modules/shared/entities/survey-question.entity';
import { SurveyResponse } from '../modules/shared/entities/survey-response.entity';
import { EmailTemplate } from '../modules/shared/entities/email-template.entity';
import { TransferVehicle } from '../modules/transfer/entities/transfer-vehicle.entity';
import { TransferRoute } from '../modules/transfer/entities/transfer-route.entity';
import { TransferRoutePoint } from '../modules/transfer/entities/transfer-route-point.entity';
import { TransferPricing } from '../modules/transfer/entities/transfer-pricing.entity';
import { TransferReservation } from '../modules/transfer/entities/transfer-reservation.entity';
import { TransferDriver } from '../modules/transfer/entities/transfer-driver.entity';
import { ChatRoom } from '../modules/chat/entities/chat-room.entity';
import { ChatMessage } from '../modules/chat/entities/chat-message.entity';
import { ChatParticipant } from '../modules/chat/entities/chat-participant.entity';
import { ChatWidgetToken } from '../modules/chat/entities/chat-widget-token.entity';
import { Customer } from '../modules/shared/entities/customer.entity';
import { CustomerEmail } from '../modules/shared/entities/customer-email.entity';

const env = loadEnv();

// Allow synchronize in production if DB_SYNC=true is set (useful for initial setup)
const allowSyncInProduction = process.env.DB_SYNC === 'true';
const shouldSynchronize = env.nodeEnv !== 'production' || allowSyncInProduction;

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: env.database.host,
  port: env.database.port,
  username: env.database.username,
  password: env.database.password,
  database: env.database.name,
  synchronize: shouldSynchronize,
  logging: env.nodeEnv === 'development',
  entities: [
    Tenant,
    Destination,
    Translation,
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
    TourInfoItem,
    TourImage,
    TourTimeSlot,
    TourPricing,
          Vehicle,
          VehiclePlate,
          VehiclePricingPeriod,
          VehicleReservationAssignment,
          VehicleCategory,
          VehicleBrand,
          VehicleModel,
          Location,
          LocationVehiclePricing,
          LocationDeliveryPricing,
          Extra,
          TenantUser,
          Currency,
          TenantSettings,
          Customer,
          CustomerEmail,
          Survey,
          SurveyQuestion,
          SurveyResponse,
          EmailTemplate,
          TransferVehicle,
          TransferRoute,
          TransferRoutePoint,
          TransferPricing,
          TransferReservation,
          TransferDriver,
          ChatRoom,
          ChatMessage,
          ChatParticipant,
          ChatWidgetToken,
  ],
  // Migrations disabled - using TypeORM synchronize instead
  // migrations: ['dist/migrations/*.js'],
});
