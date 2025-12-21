import 'reflect-metadata';
import { AppDataSource } from '../config/data-source';
import { Tenant } from '../modules/tenants/entities/tenant.entity';
import { Language } from '../modules/shared/entities/language.entity';
import { Currency, CurrencyCode } from '../modules/shared/entities/currency.entity';
import { PhoneCountry } from '../modules/shared/entities/phone-country.entity';
import { Destination } from '../modules/shared/entities/destination.entity';
import { Hotel } from '../modules/shared/entities/hotel.entity';
import { PaymentMethod, PaymentProvider } from '../modules/shared/entities/payment-method.entity';
import { Blog, BlogStatus } from '../modules/shared/entities/blog.entity';
import { Translation } from '../modules/shared/entities/translation.entity';
import { Survey, SurveyStatus } from '../modules/shared/entities/survey.entity';
import { SurveyQuestion, QuestionType } from '../modules/shared/entities/survey-question.entity';
import { EmailTemplate, EmailTemplateType } from '../modules/shared/entities/email-template.entity';
import { Operation } from '../modules/shared/entities/operation.entity';
import { Reservation, ReservationType, ReservationStatus } from '../modules/shared/entities/reservation.entity';
import { Vehicle, FuelType, TransmissionType } from '../modules/rentacar/entities/vehicle.entity';
import { VehicleCategory } from '../modules/rentacar/entities/vehicle-category.entity';
import { VehicleBrand } from '../modules/rentacar/entities/vehicle-brand.entity';
import { VehicleModel } from '../modules/rentacar/entities/vehicle-model.entity';
import { Location, LocationType } from '../modules/rentacar/entities/location.entity';
import { VehiclePlate } from '../modules/rentacar/entities/vehicle-plate.entity';
import { VehiclePricingPeriod, SeasonName } from '../modules/rentacar/entities/vehicle-pricing-period.entity';
import { DayRange } from '../modules/rentacar/entities/location-vehicle-pricing.entity';
import { LocationVehiclePricing } from '../modules/rentacar/entities/location-vehicle-pricing.entity';
import { LocationDeliveryPricing } from '../modules/rentacar/entities/location-delivery-pricing.entity';
import { Tour } from '../modules/tour/entities/tour.entity';
import { TourFeature } from '../modules/tour/entities/tour-feature.entity';
import { TourImage } from '../modules/tour/entities/tour-image.entity';
import { TourInfoItem } from '../modules/tour/entities/tour-info-item.entity';
import { TourPricing } from '../modules/tour/entities/tour-pricing.entity';
import { TourSession } from '../modules/tour/entities/tour-session.entity';
import { TourTimeSlot } from '../modules/tour/entities/tour-time-slot.entity';
import { TransferVehicle, TransferVehicleType, TransferVehicleFeature } from '../modules/transfer/entities/transfer-vehicle.entity';
import { TransferRoute, TransferRouteType } from '../modules/transfer/entities/transfer-route.entity';
import { TransferRoutePoint, RoutePointType } from '../modules/transfer/entities/transfer-route-point.entity';
import { TransferPricing } from '../modules/transfer/entities/transfer-pricing.entity';
import { TransferDriver } from '../modules/transfer/entities/transfer-driver.entity';
import { TransferReservation } from '../modules/transfer/entities/transfer-reservation.entity';
import { ChatRoom, ChatRoomStatus } from '../modules/chat/entities/chat-room.entity';
import { ChatMessage, ChatMessageType, ChatMessageSenderType } from '../modules/chat/entities/chat-message.entity';
import { ChatWidgetToken } from '../modules/chat/entities/chat-widget-token.entity';
import crypto from 'crypto';

const seedMockData = async () => {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    // Get repositories
    const tenantRepo = AppDataSource.getRepository(Tenant);
    const languageRepo = AppDataSource.getRepository(Language);
    const currencyRepo = AppDataSource.getRepository(Currency);
    const phoneCountryRepo = AppDataSource.getRepository(PhoneCountry);
    // DestinationRepo no longer needed, using DestinationService instead
    const hotelRepo = AppDataSource.getRepository(Hotel);
    const paymentMethodRepo = AppDataSource.getRepository(PaymentMethod);
    const blogRepo = AppDataSource.getRepository(Blog);
    const translationRepo = AppDataSource.getRepository(Translation);
    const surveyRepo = AppDataSource.getRepository(Survey);
    const surveyQuestionRepo = AppDataSource.getRepository(SurveyQuestion);
    const emailTemplateRepo = AppDataSource.getRepository(EmailTemplate);
    const operationRepo = AppDataSource.getRepository(Operation);
    const reservationRepo = AppDataSource.getRepository(Reservation);
    const vehicleRepo = AppDataSource.getRepository(Vehicle);
    const vehicleCategoryRepo = AppDataSource.getRepository(VehicleCategory);
    const vehicleBrandRepo = AppDataSource.getRepository(VehicleBrand);
    const vehicleModelRepo = AppDataSource.getRepository(VehicleModel);
    const locationRepo = AppDataSource.getRepository(Location);
    const vehiclePlateRepo = AppDataSource.getRepository(VehiclePlate);
    const vehiclePricingPeriodRepo = AppDataSource.getRepository(VehiclePricingPeriod);
    const locationVehiclePricingRepo = AppDataSource.getRepository(LocationVehiclePricing);
    const locationDeliveryPricingRepo = AppDataSource.getRepository(LocationDeliveryPricing);
    const tourRepo = AppDataSource.getRepository(Tour);
    const tourFeatureRepo = AppDataSource.getRepository(TourFeature);
    const tourImageRepo = AppDataSource.getRepository(TourImage);
    const tourInfoItemRepo = AppDataSource.getRepository(TourInfoItem);
    const tourPricingRepo = AppDataSource.getRepository(TourPricing);
    const tourSessionRepo = AppDataSource.getRepository(TourSession);
    const tourTimeSlotRepo = AppDataSource.getRepository(TourTimeSlot);
    const transferVehicleRepo = AppDataSource.getRepository(TransferVehicle);
    const transferRouteRepo = AppDataSource.getRepository(TransferRoute);
    const transferRoutePointRepo = AppDataSource.getRepository(TransferRoutePoint);
    const transferPricingRepo = AppDataSource.getRepository(TransferPricing);
    const transferDriverRepo = AppDataSource.getRepository(TransferDriver);
    const transferReservationRepo = AppDataSource.getRepository(TransferReservation);
    const chatRoomRepo = AppDataSource.getRepository(ChatRoom);
    const chatMessageRepo = AppDataSource.getRepository(ChatMessage);
    const chatWidgetTokenRepo = AppDataSource.getRepository(ChatWidgetToken);

    // Get existing tenants
    const tenants = await tenantRepo.find();
    if (tenants.length === 0) {
      console.log('⚠️  No tenants found. Please create tenants first.');
      return;
    }

    const tourTenant = tenants.find(t => t.category === 'tour') || tenants[0];
    const rentacarTenant = tenants.find(t => t.category === 'rentacar') || tenants[0];

    console.log(`📦 Seeding mock data for ${tenants.length} tenant(s)...`);

    // 1. Languages
    console.log('🌐 Seeding languages...');
    const languages = await languageRepo.find();
    if (languages.length === 0) {
      const langData = [
        { code: 'tr', name: 'Türkçe', isActive: true, isDefault: true },
        { code: 'en', name: 'English', isActive: true, isDefault: false },
        { code: 'de', name: 'Deutsch', isActive: true, isDefault: false },
        { code: 'ru', name: 'Русский', isActive: true, isDefault: false },
      ];
      for (const lang of langData) {
        const existing = await languageRepo.findOne({ where: { code: lang.code } });
        if (!existing) {
          await languageRepo.save(languageRepo.create(lang));
        }
      }
    }
    const savedLanguages = await languageRepo.find();
    const trLang = savedLanguages.find(l => l.code === 'tr') || savedLanguages[0];
    const enLang = savedLanguages.find(l => l.code === 'en') || savedLanguages[0];

    // 2. Currencies
    console.log('💰 Seeding currencies...');
    const currencies = await currencyRepo.find();
    if (currencies.length === 0) {
      const currencyData = [
        { code: CurrencyCode.TRY, name: 'Turkish Lira', symbol: '₺', rateToTry: 1.0, isBaseCurrency: true, isActive: true },
        { code: CurrencyCode.EUR, name: 'Euro', symbol: '€', rateToTry: 35.50, isBaseCurrency: false, isActive: true },
        { code: CurrencyCode.USD, name: 'US Dollar', symbol: '$', rateToTry: 32.80, isBaseCurrency: false, isActive: true },
        { code: CurrencyCode.GBP, name: 'British Pound', symbol: '£', rateToTry: 41.20, isBaseCurrency: false, isActive: true },
      ];
      for (const curr of currencyData) {
        const existing = await currencyRepo.findOne({ where: { code: curr.code } });
        if (!existing) {
          await currencyRepo.save(currencyRepo.create({ ...curr, lastUpdatedAt: new Date() }));
        }
      }
    }

    // 3. Phone Countries
    console.log('📞 Seeding phone countries...');
    const phoneCountries = await phoneCountryRepo.find();
    if (phoneCountries.length === 0) {
      const phoneCountryData = [
        { isoCode: 'TR', name: 'Türkiye', dialCode: '+90' },
        { isoCode: 'US', name: 'United States', dialCode: '+1' },
        { isoCode: 'DE', name: 'Germany', dialCode: '+49' },
        { isoCode: 'GB', name: 'United Kingdom', dialCode: '+44' },
        { isoCode: 'RU', name: 'Russia', dialCode: '+7' },
      ];
      for (const pc of phoneCountryData) {
        const existing = await phoneCountryRepo.findOne({ where: { isoCode: pc.isoCode } });
        if (!existing) {
          await phoneCountryRepo.save(phoneCountryRepo.create(pc));
        }
      }
    }
    const savedPhoneCountries = await phoneCountryRepo.find();
    const trPhoneCountry = savedPhoneCountries.find(pc => pc.isoCode === 'TR') || savedPhoneCountries[0];

    // 4. Destinations
    console.log('📍 Seeding destinations...');
    const { DestinationService } = await import('../modules/shared/services/destination.service');
    const { LanguageService } = await import('../modules/shared/services/language.service');
    
    const defaultLanguage = await LanguageService.getDefault();
    if (!defaultLanguage) {
      throw new Error('No default language found. Please set a default language first.');
    }

    const destinationData = [
      { name: 'Istanbul', country: 'Turkey', city: 'Istanbul' },
      { name: 'Antalya', country: 'Turkey', city: 'Antalya' },
      { name: 'Bodrum', country: 'Turkey', city: 'Bodrum' },
      { name: 'Cappadocia', country: 'Turkey', city: 'Nevşehir' },
      { name: 'Pamukkale', country: 'Turkey', city: 'Denizli' },
    ];
    const destinations: Destination[] = [];
    
    // Use first tenant for destinations (or create tenant-specific destinations)
    const firstTenant = tenants[0];
    const allDestinations = await DestinationService.list(firstTenant.id);
    
    for (const dest of destinationData) {
      const existing = allDestinations.find(d =>
        d.translations?.some(t => t.languageId === defaultLanguage.id && t.name === dest.name)
      );
      if (existing) {
        destinations.push(existing);
      } else {
        const created = await DestinationService.create({
          tenantId: firstTenant.id,
          translations: [
            {
              languageId: defaultLanguage.id,
              title: dest.name,
              description: `${dest.name}, ${dest.city}, ${dest.country}`,
            },
          ],
        });
        destinations.push(created);
      }
    }

    // 5. Hotels
    console.log('🏨 Seeding hotels...');
    const hotelData = [
      { name: 'Grand Hotel Istanbul', starRating: 5, address: 'Taksim Square, Istanbul', city: 'Istanbul', country: 'Turkey', destination: destinations[0] },
      { name: 'Beach Resort Antalya', starRating: 4.5, address: 'Lara Beach, Antalya', city: 'Antalya', country: 'Turkey', destination: destinations[1] },
      { name: 'Bodrum Marina Hotel', starRating: 4, address: 'Bodrum Marina, Bodrum', city: 'Bodrum', country: 'Turkey', destination: destinations[2] },
      { name: 'Cave Hotel Cappadocia', starRating: 4.5, address: 'Göreme, Nevşehir', city: 'Nevşehir', country: 'Turkey', destination: destinations[3] },
    ];
    const hotels: Hotel[] = [];
    for (const hotel of hotelData) {
      const existing = await hotelRepo.findOne({ where: { name: hotel.name } });
      if (!existing) {
        hotels.push(await hotelRepo.save(hotelRepo.create(hotel)));
      } else {
        hotels.push(existing);
      }
    }

    // 6. Payment Methods
    console.log('💳 Seeding payment methods...');
    for (const tenant of tenants) {
      const existingPayments = await paymentMethodRepo.find({ where: { tenantId: tenant.id } });
      if (existingPayments.length === 0) {
        const paymentData = [
          { tenant, displayName: 'Credit Card', provider: PaymentProvider.CREDIT_CARD, isActive: true, config: {} },
          { tenant, displayName: 'Bank Transfer', provider: PaymentProvider.BANK_TRANSFER, isActive: true, config: {} },
          { tenant, displayName: 'PayPal', provider: PaymentProvider.PAYPAL, isActive: true, config: {} },
        ];
        for (const pm of paymentData) {
          await paymentMethodRepo.save(paymentMethodRepo.create(pm));
        }
      }
    }

    // 7. Vehicle Categories, Brands, Models (Rentacar)
    console.log('🚗 Seeding vehicle data...');
    if (rentacarTenant) {
      // Categories
      const categories: VehicleCategory[] = [];
      const categoryData = [
        { isActive: true, sortOrder: 1, translations: [{ language: trLang, name: 'Ekonomi' }, { language: enLang, name: 'Economy' }] },
        { isActive: true, sortOrder: 2, translations: [{ language: trLang, name: 'Kompakt' }, { language: enLang, name: 'Compact' }] },
        { isActive: true, sortOrder: 3, translations: [{ language: trLang, name: 'Orta Sınıf' }, { language: enLang, name: 'Mid-Size' }] },
        { isActive: true, sortOrder: 4, translations: [{ language: trLang, name: 'Lüks' }, { language: enLang, name: 'Luxury' }] },
        { isActive: true, sortOrder: 5, translations: [{ language: trLang, name: 'SUV' }, { language: enLang, name: 'SUV' }] },
      ];
      for (const cat of categoryData) {
        const category = vehicleCategoryRepo.create({ isActive: cat.isActive, sortOrder: cat.sortOrder });
        const savedCategory = await vehicleCategoryRepo.save(category);
        for (const trans of cat.translations) {
          await translationRepo.save(translationRepo.create({
            model: 'VehicleCategory',
            modelId: savedCategory.id,
            languageId: trans.language.id,
            name: trans.name,
          }));
        }
        categories.push(savedCategory);
      }

      // Brands
      const brands: VehicleBrand[] = [];
      const brandData = [
        { name: 'Toyota', isActive: true, sortOrder: 1 },
        { name: 'Ford', isActive: true, sortOrder: 2 },
        { name: 'Mercedes-Benz', isActive: true, sortOrder: 3 },
        { name: 'BMW', isActive: true, sortOrder: 4 },
        { name: 'Audi', isActive: true, sortOrder: 5 },
      ];
      for (const brand of brandData) {
        const existing = await vehicleBrandRepo.findOne({ where: { name: brand.name } });
        if (!existing) {
          brands.push(await vehicleBrandRepo.save(vehicleBrandRepo.create(brand)));
        } else {
          brands.push(existing);
        }
      }

      // Models
      const models: VehicleModel[] = [];
      const modelData = [
        { brand: brands[0], name: 'Corolla', isActive: true, sortOrder: 1 },
        { brand: brands[0], name: 'Yaris', isActive: true, sortOrder: 2 },
        { brand: brands[1], name: 'Focus', isActive: true, sortOrder: 1 },
        { brand: brands[2], name: 'C-Class', isActive: true, sortOrder: 1 },
        { brand: brands[3], name: '3 Series', isActive: true, sortOrder: 1 },
        { brand: brands[4], name: 'A4', isActive: true, sortOrder: 1 },
      ];
      for (const model of modelData) {
        const existing = await vehicleModelRepo.findOne({ where: { name: model.name, brandId: model.brand.id } });
        if (!existing) {
          models.push(await vehicleModelRepo.save(vehicleModelRepo.create(model)));
        } else {
          models.push(existing);
        }
      }

      // Locations
      const locations: Location[] = [];
      const locationData = [
        { tenant: rentacarTenant, name: 'Istanbul Airport', type: LocationType.HAVALIMANI, isActive: true, sort: 1 },
        { tenant: rentacarTenant, name: 'Antalya Airport', type: LocationType.HAVALIMANI, isActive: true, sort: 2 },
        { tenant: rentacarTenant, name: 'Bodrum Office', type: LocationType.MERKEZ, isActive: true, sort: 3 },
      ];
      for (const loc of locationData) {
        const existing = await locationRepo.findOne({ where: { name: loc.name, tenantId: rentacarTenant.id } });
        if (!existing) {
          const savedLocation = await locationRepo.save(locationRepo.create(loc));
          locations.push(savedLocation);
        } else {
          locations.push(existing);
        }
      }

      // Vehicles
      const vehiclePrices = [250, 200, 500, 550];
      const vehicleData = [
        { tenant: rentacarTenant, name: 'Toyota Corolla 2023', category: categories[1], brand: brands[0], model: models[0], year: 2023, transmission: TransmissionType.AUTOMATIC, fuelType: FuelType.HYBRID, seats: 5, luggage: 2, doors: 4, baseRate: 250, currencyCode: 'TRY', isActive: true },
        { tenant: rentacarTenant, name: 'Ford Focus 2022', category: categories[1], brand: brands[1], model: models[2], year: 2022, transmission: TransmissionType.MANUAL, fuelType: FuelType.GASOLINE, seats: 5, luggage: 2, doors: 4, baseRate: 200, currencyCode: 'TRY', isActive: true },
        { tenant: rentacarTenant, name: 'Mercedes C-Class 2023', category: categories[3], brand: brands[2], model: models[3], year: 2023, transmission: TransmissionType.AUTOMATIC, fuelType: FuelType.GASOLINE, seats: 5, luggage: 2, doors: 4, baseRate: 500, currencyCode: 'TRY', isActive: true },
        { tenant: rentacarTenant, name: 'BMW 3 Series 2023', category: categories[3], brand: brands[3], model: models[4], year: 2023, transmission: TransmissionType.AUTOMATIC, fuelType: FuelType.GASOLINE, seats: 5, luggage: 2, doors: 4, baseRate: 550, currencyCode: 'TRY', isActive: true },
      ];
      const vehicles: Vehicle[] = [];
      for (const veh of vehicleData) {
        vehicles.push(await vehicleRepo.save(vehicleRepo.create(veh)));
      }

      // Vehicle Plates
      for (let i = 0; i < vehicles.length; i++) {
        const plate = vehiclePlateRepo.create({
          vehicle: vehicles[i],
          plateNumber: `34ABC${1000 + i}`,
          isActive: true,
        });
        await vehiclePlateRepo.save(plate);
      }

      // Vehicle Pricing Periods
      for (let i = 0; i < vehicles.length; i++) {
        // Summer season (June, July, August)
        for (const month of [6, 7, 8]) {
          const pricingPeriod = vehiclePricingPeriodRepo.create({
            vehicle: vehicles[i],
            season: SeasonName.SUMMER,
            month,
            dailyRate: vehiclePrices[i] * 1.5,
          });
          await vehiclePricingPeriodRepo.save(pricingPeriod);
        }
      }

      // Location Vehicle Pricing
      for (const location of locations) {
        for (let i = 0; i < vehicles.length; i++) {
          // Create pricing for a specific month and day range
          const pricing = locationVehiclePricingRepo.create({
            location,
            vehicle: vehicles[i],
            month: 6, // June
            dayRange: DayRange.RANGE_1_3,
            price: vehiclePrices[i],
            discount: 0,
            minDays: 1,
            isActive: true,
          });
          await locationVehiclePricingRepo.save(pricing);
        }
      }
    }

    // 8. Tours (Tour Tenant)
    console.log('🎫 Seeding tours...');
    if (tourTenant) {
      const tourData = [
        { tenant: tourTenant, destination: destinations[0], title: 'Istanbul Tour', slug: 'istanbul-tour', basePrice: 100, currencyCode: 'EUR', durationHours: 8, maxCapacity: 30, isActive: true, translations: [{ language: trLang, title: 'Istanbul Turu', description: 'İstanbul\'un tarihi yerlerini keşfedin' }, { language: enLang, title: 'Istanbul Tour', description: 'Discover Istanbul\'s historical sites' }] },
        { tenant: tourTenant, destination: destinations[1], title: 'Antalya City Tour', slug: 'antalya-city-tour', basePrice: 80, currencyCode: 'EUR', durationHours: 6, maxCapacity: 25, isActive: true, translations: [{ language: trLang, title: 'Antalya Şehir Turu', description: 'Antalya\'nın güzelliklerini keşfedin' }, { language: enLang, title: 'Antalya City Tour', description: 'Discover the beauty of Antalya' }] },
        { tenant: tourTenant, destination: destinations[3], title: 'Cappadocia Balloon Tour', slug: 'cappadocia-balloon-tour', basePrice: 200, currencyCode: 'EUR', durationHours: 4, maxCapacity: 20, isActive: true, translations: [{ language: trLang, title: 'Kapadokya Balon Turu', description: 'Kapadokya\'da balon turu deneyimi' }, { language: enLang, title: 'Cappadocia Balloon Tour', description: 'Hot air balloon experience in Cappadocia' }] },
      ];
      for (const tour of tourData) {
        const savedTour = await tourRepo.save(tourRepo.create({
          tenant: tour.tenant,
          destination: tour.destination,
          title: tour.title,
          slug: tour.slug,
          basePrice: tour.basePrice,
          currencyCode: tour.currencyCode,
          durationHours: tour.durationHours,
          maxCapacity: tour.maxCapacity,
          isActive: tour.isActive,
        }));
        for (const trans of tour.translations) {
          const valueData: any = {};
          if (trans.description) valueData.description = trans.description;
          
          await translationRepo.save(translationRepo.create({
            model: 'Tour',
            modelId: savedTour.id,
            languageId: trans.language.id,
            name: trans.title,
            value: Object.keys(valueData).length > 0 ? JSON.stringify(valueData) : undefined,
          }));
        }
      }
    }

    // 9. Transfer Vehicles
    console.log('🚐 Seeding transfer vehicles...');
    for (const tenant of tenants) {
      const existingTransferVehicles = await transferVehicleRepo.find({ where: { tenantId: tenant.id } });
      if (existingTransferVehicles.length === 0) {
        const transferVehicleData = [
          { tenant, name: 'VIP Mercedes Vito', type: TransferVehicleType.VIP, passengerCapacity: 8, luggageCapacity: 4, hasDriver: true, features: [TransferVehicleFeature.WIFI, TransferVehicleFeature.DRINKS], isActive: true, sortOrder: 1 },
          { tenant, name: 'Premium Shuttle', type: TransferVehicleType.PREMIUM, passengerCapacity: 16, luggageCapacity: 8, hasDriver: true, features: [TransferVehicleFeature.WIFI], isActive: true, sortOrder: 2 },
          { tenant, name: 'Luxury S-Class', type: TransferVehicleType.LUXURY, passengerCapacity: 4, luggageCapacity: 2, hasDriver: true, features: [TransferVehicleFeature.WIFI, TransferVehicleFeature.DRINKS, TransferVehicleFeature.NEWSPAPER], isActive: true, sortOrder: 3 },
        ];
        for (const tv of transferVehicleData) {
          await transferVehicleRepo.save(transferVehicleRepo.create(tv));
        }
      }
    }

    // 10. Transfer Routes & Points
    console.log('🗺️  Seeding transfer routes...');
    for (const tenant of tenants) {
      const existingRoutes = await transferRouteRepo.find({ where: { tenantId: tenant.id } });
      if (existingRoutes.length === 0) {
        const routeData = [
          { tenant, name: 'Istanbul Airport → City Center', type: TransferRouteType.AIRPORT_TO_HOTEL, distance: 50, averageDurationMinutes: 60, isActive: true, sortOrder: 1 },
          { tenant, name: 'Antalya Airport → Lara Beach', type: TransferRouteType.AIRPORT_TO_HOTEL, distance: 15, averageDurationMinutes: 25, isActive: true, sortOrder: 2 },
        ];
        for (const route of routeData) {
          const savedRoute = await transferRouteRepo.save(transferRouteRepo.create(route));
          // Create route points
          await transferRoutePointRepo.save(transferRoutePointRepo.create({
            route: savedRoute,
            name: savedRoute.name.includes('Istanbul') ? 'IST Airport' : 'Antalya Airport',
            type: RoutePointType.AIRPORT,
            isPickup: true,
            isActive: true,
            latitude: savedRoute.name.includes('Istanbul') ? '41.2753' : '36.9012',
            longitude: savedRoute.name.includes('Istanbul') ? '28.7519' : '30.7928',
          }));
          await transferRoutePointRepo.save(transferRoutePointRepo.create({
            route: savedRoute,
            name: savedRoute.name.includes('Lara') ? 'Lara Beach Hotel' : 'Istanbul City Center',
            type: savedRoute.name.includes('Lara') ? RoutePointType.HOTEL : RoutePointType.CITY_CENTER,
            isPickup: false,
            isActive: true,
            latitude: savedRoute.name.includes('Lara') ? '36.8563' : '41.0082',
            longitude: savedRoute.name.includes('Lara') ? '30.8397' : '28.9784',
          }));
        }
      }
    }

    // 11. Transfer Drivers
    console.log('👨‍✈️ Seeding transfer drivers...');
    for (const tenant of tenants) {
      const existingDrivers = await transferDriverRepo.find({ where: { tenantId: tenant.id } });
      if (existingDrivers.length === 0) {
        const driverData = [
          { tenant, name: 'Ahmet Yılmaz', phone: '+905551234567', email: 'ahmet@example.com', licenseNumber: 'LIC123456', isActive: true, isAvailable: true },
          { tenant, name: 'Mehmet Demir', phone: '+905559876543', email: 'mehmet@example.com', licenseNumber: 'LIC789012', isActive: true, isAvailable: true },
          { tenant, name: 'Ali Kaya', phone: '+905557654321', email: 'ali@example.com', licenseNumber: 'LIC345678', isActive: true, isAvailable: true },
        ];
        for (const driver of driverData) {
          await transferDriverRepo.save(transferDriverRepo.create(driver));
        }
      }
    }

    // 12. Blogs
    console.log('📝 Seeding blogs...');
    for (const tenant of tenants) {
      const existingBlogs = await blogRepo.find({ where: { tenantId: tenant.id } });
      if (existingBlogs.length === 0) {
        const blogData = [
          { tenant, title: 'Istanbul Travel Guide', slug: 'istanbul-travel-guide', content: 'Comprehensive guide to Istanbul...', status: BlogStatus.PUBLISHED, publishedAt: new Date() },
          { tenant, title: 'Best Beaches in Antalya', slug: 'best-beaches-antalya', content: 'Discover the most beautiful beaches...', status: BlogStatus.PUBLISHED, publishedAt: new Date() },
        ];
        for (const blog of blogData) {
          await blogRepo.save(blogRepo.create(blog));
        }
      }
    }

    // 13. Surveys
    console.log('📊 Seeding surveys...');
    for (const tenant of tenants) {
      const existingSurveys = await surveyRepo.find({ where: { tenantId: tenant.id } });
      if (existingSurveys.length === 0) {
        const survey = await surveyRepo.save(surveyRepo.create({
          tenant,
          language: trLang,
          title: 'Müşteri Memnuniyet Anketi',
          description: 'Deneyiminizi değerlendirin',
          status: SurveyStatus.ACTIVE,
          isActive: true,
          autoSend: true,
          sendAfterDays: 1,
          emailSubject: 'Deneyiminizi Değerlendirin',
        }));
        // Survey Questions
        await surveyQuestionRepo.save(surveyQuestionRepo.create({
          survey,
          question: 'Genel memnuniyetiniz nedir?',
          type: QuestionType.RATING,
          isRequired: true,
          sortOrder: 1,
        }));
        await surveyQuestionRepo.save(surveyQuestionRepo.create({
          survey,
          question: 'Önerileriniz var mı?',
          type: QuestionType.TEXT,
          isRequired: false,
          sortOrder: 2,
        }));
      }
    }

    // 14. Email Templates
    console.log('📧 Seeding email templates...');
    for (const tenant of tenants) {
      const existingTemplates = await emailTemplateRepo.find({ where: { tenantId: tenant.id } });
      if (existingTemplates.length === 0) {
        const templateData = [
          {
            tenant,
            language: trLang,
            type: EmailTemplateType.RESERVATION_CONFIRMATION,
            name: 'Rezervasyon Onay',
            subject: 'Rezervasyonunuz Onaylandı - {{reference}}',
            body: '<p>Sayın {{customerName}},</p><p>Rezervasyonunuz başarıyla onaylanmıştır.</p><p>Referans: {{reference}}</p>',
            isActive: true,
          },
          {
            tenant,
            language: enLang,
            type: EmailTemplateType.RESERVATION_CONFIRMATION,
            name: 'Reservation Confirmation',
            subject: 'Your Reservation Confirmed - {{reference}}',
            body: '<p>Dear {{customerName}},</p><p>Your reservation has been confirmed.</p><p>Reference: {{reference}}</p>',
            isActive: true,
          },
        ];
        for (const template of templateData) {
          await emailTemplateRepo.save(emailTemplateRepo.create(template));
        }
      }
    }

    // 15. Operations
    console.log('📋 Seeding operations...');
    for (const tenant of tenants) {
      const existingOps = await operationRepo.find({ where: { tenantId: tenant.id } });
      if (existingOps.length === 0) {
        const opData = [
          { tenant, type: 'vehicle_created', performedBy: 'System', performedAt: new Date(), details: { vehicleId: 'mock-vehicle-1' } },
          { tenant, type: 'reservation_created', performedBy: 'System', performedAt: new Date(), details: { reservationId: 'mock-reservation-1' } },
        ];
        for (const op of opData) {
          await operationRepo.save(operationRepo.create(op));
        }
      }
    }

    // 16. Reservations
    console.log('📅 Seeding reservations...');
    for (const tenant of tenants) {
      const existingReservations = await reservationRepo.find({ where: { tenantId: tenant.id } });
      if (existingReservations.length === 0) {
        const checkIn = new Date();
        checkIn.setDate(checkIn.getDate() + 7);
        const checkOut = new Date(checkIn);
        checkOut.setDate(checkOut.getDate() + 3);
        const reservationData = [
          {
            tenant,
            reference: `RES-${Date.now()}-1`,
            type: tenant.category === 'tour' ? ReservationType.TOUR : ReservationType.RENTACAR,
            status: ReservationStatus.CONFIRMED,
            customerName: 'Ahmet Yılmaz',
            customerEmail: 'ahmet@example.com',
            customerPhone: '+905551234567',
            customerPhoneCountry: trPhoneCountry,
            customerLanguage: trLang,
            checkIn,
            checkOut,
          },
          {
            tenant,
            reference: `RES-${Date.now()}-2`,
            type: tenant.category === 'tour' ? ReservationType.TOUR : ReservationType.RENTACAR,
            status: ReservationStatus.PENDING,
            customerName: 'John Doe',
            customerEmail: 'john@example.com',
            customerPhone: '+1234567890',
            customerLanguage: enLang,
            checkIn,
            checkOut,
          },
        ];
        for (const res of reservationData) {
          await reservationRepo.save(reservationRepo.create(res));
        }
      }
    }

    // 17. Chat Widget Tokens
    console.log('💬 Seeding chat widget tokens...');
    for (const tenant of tenants) {
      const existingToken = await chatWidgetTokenRepo.findOne({ where: { tenantId: tenant.id } });
      if (!existingToken) {
        const publicKey = crypto.randomBytes(32).toString('hex');
        const secretKey = crypto.randomBytes(64).toString('hex');
        await chatWidgetTokenRepo.save(chatWidgetTokenRepo.create({
          tenant,
          publicKey,
          secretKey,
          isActive: true,
        }));
      }
    }

    // 18. Chat Rooms & Messages
    console.log('💬 Seeding chat rooms...');
    for (const tenant of tenants) {
      const existingRooms = await chatRoomRepo.find({ where: { tenantId: tenant.id } });
      if (existingRooms.length === 0) {
        const room = await chatRoomRepo.save(chatRoomRepo.create({
          tenant,
          title: 'Visitor Inquiry',
          status: ChatRoomStatus.ACTIVE,
          visitorId: `visitor-${Date.now()}`,
          visitorName: 'Test Visitor',
          visitorEmail: 'visitor@example.com',
          visitorPhone: '+905551234567',
        }));
        await chatMessageRepo.save(chatMessageRepo.create({
          room,
          senderType: ChatMessageSenderType.VISITOR,
          messageType: ChatMessageType.TEXT,
          content: 'Hello, I need help with my reservation.',
          isRead: false,
        }));
      }
    }

    console.log('✅ Mock data seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding mock data:', error);
    process.exit(1);
  }
};

seedMockData();

