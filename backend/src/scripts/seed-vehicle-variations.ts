import 'reflect-metadata';
import { AppDataSource } from '../config/data-source';
import { Tenant, TenantCategory } from '../modules/tenants/entities/tenant.entity';
import { VehicleCategoryService } from '../modules/rentacar/services/vehicle-category.service';
import { VehicleBrandService } from '../modules/rentacar/services/vehicle-brand.service';
import { VehicleModelService } from '../modules/rentacar/services/vehicle-model.service';
import { VehicleService, CreateVehicleInput } from '../modules/rentacar/services/vehicle.service';
import { Vehicle, FuelType, TransmissionType } from '../modules/rentacar/entities/vehicle.entity';
import { Repository } from 'typeorm';

/**
 * Tüm kategori, marka ve modellere uygun araç varyasyonları ekler
 * Kullanım: npm run seed:vehicle-variations
 */

// Kategori bazlı araç özellikleri şablonları
type VehicleTemplate = {
  transmission: TransmissionType;
  fuelType: FuelType;
  seats: number;
  luggage: number;
  doors: number;
  bodyType: string;
  hasAirConditioning: boolean;
  hasAbs: boolean;
  hasRadio: boolean;
  hasCd?: boolean;
  hasSunroof?: boolean;
  isFourWheelDrive?: boolean;
  baseRate: number; // EUR cinsinden günlük fiyat
};

const CATEGORY_TEMPLATES: Record<string, VehicleTemplate[]> = {
  // Ekonomi sınıfı - Küçük, ekonomik araçlar
  Ekonomi: [
    {
      transmission: TransmissionType.MANUAL,
      fuelType: FuelType.GASOLINE,
      seats: 4,
      luggage: 2,
      doors: 4,
      bodyType: 'Hatchback',
      hasAirConditioning: true,
      hasAbs: true,
      hasRadio: true,
      baseRate: 25,
    },
    {
      transmission: TransmissionType.AUTOMATIC,
      fuelType: FuelType.GASOLINE,
      seats: 4,
      luggage: 2,
      doors: 4,
      bodyType: 'Hatchback',
      hasAirConditioning: true,
      hasAbs: true,
      hasRadio: true,
      baseRate: 30,
    },
  ],
  // Kompakt sınıfı
  Kompakt: [
    {
      transmission: TransmissionType.AUTOMATIC,
      fuelType: FuelType.GASOLINE,
      seats: 5,
      luggage: 3,
      doors: 4,
      bodyType: 'Sedan',
      hasAirConditioning: true,
      hasAbs: true,
      hasRadio: true,
      baseRate: 40,
    },
    {
      transmission: TransmissionType.AUTOMATIC,
      fuelType: FuelType.DIESEL,
      seats: 5,
      luggage: 3,
      doors: 4,
      bodyType: 'Sedan',
      hasAirConditioning: true,
      hasAbs: true,
      hasRadio: true,
      baseRate: 45,
    },
  ],
  // Orta sınıf
  'Orta Sınıf': [
    {
      transmission: TransmissionType.AUTOMATIC,
      fuelType: FuelType.GASOLINE,
      seats: 5,
      luggage: 4,
      doors: 4,
      bodyType: 'Sedan',
      hasAirConditioning: true,
      hasAbs: true,
      hasRadio: true,
      baseRate: 55,
    },
    {
      transmission: TransmissionType.AUTOMATIC,
      fuelType: FuelType.DIESEL,
      seats: 5,
      luggage: 4,
      doors: 4,
      bodyType: 'Sedan',
      hasAirConditioning: true,
      hasAbs: true,
      hasRadio: true,
      baseRate: 60,
    },
    {
      transmission: TransmissionType.AUTOMATIC,
      fuelType: FuelType.HYBRID,
      seats: 5,
      luggage: 4,
      doors: 4,
      bodyType: 'Sedan',
      hasAirConditioning: true,
      hasAbs: true,
      hasRadio: true,
      baseRate: 65,
    },
  ],
  // Lüks sınıfı
  Lüks: [
    {
      transmission: TransmissionType.AUTOMATIC,
      fuelType: FuelType.GASOLINE,
      seats: 5,
      luggage: 5,
      doors: 4,
      bodyType: 'Sedan',
      hasAirConditioning: true,
      hasAbs: true,
      hasRadio: true,
      hasCd: true,
      hasSunroof: true,
      baseRate: 120,
    },
    {
      transmission: TransmissionType.AUTOMATIC,
      fuelType: FuelType.DIESEL,
      seats: 5,
      luggage: 5,
      doors: 4,
      bodyType: 'Sedan',
      hasAirConditioning: true,
      hasAbs: true,
      hasRadio: true,
      hasCd: true,
      hasSunroof: true,
      baseRate: 130,
    },
    {
      transmission: TransmissionType.AUTOMATIC,
      fuelType: FuelType.HYBRID,
      seats: 5,
      luggage: 5,
      doors: 4,
      bodyType: 'Sedan',
      hasAirConditioning: true,
      hasAbs: true,
      hasRadio: true,
      hasCd: true,
      hasSunroof: true,
      baseRate: 140,
    },
  ],
  // SUV sınıfı
  SUV: [
    {
      transmission: TransmissionType.AUTOMATIC,
      fuelType: FuelType.DIESEL,
      seats: 5,
      luggage: 6,
      doors: 5,
      bodyType: 'SUV',
      hasAirConditioning: true,
      hasAbs: true,
      hasRadio: true,
      isFourWheelDrive: true,
      baseRate: 80,
    },
    {
      transmission: TransmissionType.AUTOMATIC,
      fuelType: FuelType.GASOLINE,
      seats: 7,
      luggage: 7,
      doors: 5,
      bodyType: 'SUV',
      hasAirConditioning: true,
      hasAbs: true,
      hasRadio: true,
      isFourWheelDrive: false,
      baseRate: 85,
    },
    {
      transmission: TransmissionType.AUTOMATIC,
      fuelType: FuelType.HYBRID,
      seats: 5,
      luggage: 6,
      doors: 5,
      bodyType: 'SUV',
      hasAirConditioning: true,
      hasAbs: true,
      hasRadio: true,
      isFourWheelDrive: true,
      baseRate: 95,
    },
  ],
};

// Yıl aralıkları (güncel modeller için)
const CURRENT_YEARS = [2021, 2022, 2023, 2024];

// Engine size ve horsepower şablonları
const ENGINE_TEMPLATES: Record<string, { engineSize: string; horsepower: string }> = {
  [FuelType.GASOLINE]: { engineSize: '1.6L', horsepower: '120 HP' },
  [FuelType.DIESEL]: { engineSize: '2.0L', horsepower: '150 HP' },
  [FuelType.HYBRID]: { engineSize: '1.8L Hybrid', horsepower: '140 HP' },
  [FuelType.ELECTRIC]: { engineSize: 'Electric', horsepower: '200 HP' },
};

async function seedVehicleVariations() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    // Tüm rentacar tenant'larını bul
    const tenantRepo = AppDataSource.getRepository(Tenant);
    const tenants = await tenantRepo.find({
      where: { category: TenantCategory.RENTACAR, isActive: true },
    });

    if (tenants.length === 0) {
      console.log('⚠️  No rentacar tenants found. Please create at least one rentacar tenant first.');
      await AppDataSource.destroy();
      return;
    }

    console.log(`📋 Found ${tenants.length} rentacar tenant(s)\n`);

    // Tüm kategorileri al
    const categories = await VehicleCategoryService.list();
    const activeCategories = categories.filter((cat) => cat.isActive);

    if (activeCategories.length === 0) {
      console.log('⚠️  No vehicle categories found. Please run seed:vehicles first.');
      await AppDataSource.destroy();
      return;
    }

    // Tüm markaları al
    const brands = await VehicleBrandService.list();
    const activeBrands = brands.filter((brand) => brand.isActive);

    if (activeBrands.length === 0) {
      console.log('⚠️  No vehicle brands found. Please run seed:vehicles first.');
      await AppDataSource.destroy();
      return;
    }

    // Kategori isimlerini map et (Türkçe/İngilizce uyum için)
    const categoryNameMap = new Map<string, string>();
    activeCategories.forEach((cat) => {
      const name = cat.translations?.[0]?.name || '';
      categoryNameMap.set(name.toLowerCase(), cat.id);
      // Ekonomi, Kompakt, Orta Sınıf, Lüks, SUV için mapping
      if (name.toLowerCase().includes('ekonomi') || name.toLowerCase().includes('economy')) {
        categoryNameMap.set('ekonomi', cat.id);
      }
      if (name.toLowerCase().includes('kompakt') || name.toLowerCase().includes('compact')) {
        categoryNameMap.set('kompakt', cat.id);
      }
      if (name.toLowerCase().includes('orta') || name.toLowerCase().includes('mid')) {
        categoryNameMap.set('orta sınıf', cat.id);
      }
      if (name.toLowerCase().includes('lüks') || name.toLowerCase().includes('luxury')) {
        categoryNameMap.set('lüks', cat.id);
      }
      if (name.toLowerCase().includes('suv')) {
        categoryNameMap.set('suv', cat.id);
      }
    });

    let totalVehiclesCreated = 0;
    let totalVehiclesSkipped = 0;

    for (const tenant of tenants) {
      console.log(`\n🏢 Processing tenant: ${tenant.name} (${tenant.slug})`);

      let vehiclesCreated = 0;
      let vehiclesSkipped = 0;

      // Her kategori için
      for (const category of activeCategories) {
        const categoryName = category.translations?.[0]?.name || '';
        const categoryKey = categoryName.toLowerCase().includes('ekonomi')
          ? 'Ekonomi'
          : categoryName.toLowerCase().includes('kompakt')
          ? 'Kompakt'
          : categoryName.toLowerCase().includes('orta')
          ? 'Orta Sınıf'
          : categoryName.toLowerCase().includes('lüks')
          ? 'Lüks'
          : categoryName.toLowerCase().includes('suv')
          ? 'SUV'
          : null;

        if (!categoryKey || !CATEGORY_TEMPLATES[categoryKey]) {
          continue; // Şablon bulunamadı, atla
        }

        const templates = CATEGORY_TEMPLATES[categoryKey];

        // Bu kategoriye uygun marka/model kombinasyonlarını bul
        // Her marka için modellerini al
        for (const brand of activeBrands.slice(0, 5)) {
          // İlk 5 marka (çok fazla olmasın)
          const models = await VehicleModelService.list(brand.id);
          const activeModels = models.filter((model) => model.isActive && model.brandId === brand.id);

          if (activeModels.length === 0) {
            continue; // Bu marka için model yok
          }

          // Her model için varyasyonlar oluştur
          for (const model of activeModels.slice(0, 2)) {
            // Her marka için maksimum 2 model
            for (const template of templates.slice(0, 1)) {
              // Her kategori için 1 şablon varyasyonu (farklı özellikler için farklı şablonlar)
              for (const year of CURRENT_YEARS.slice(-1)) {
                // Son 1 yıl (2024) - her şablon için 1 yıl
                try {
                  // Araç adı oluştur
                  const vehicleName = `${brand.name} ${model.name} ${year}`;

                  // Mevcut araçları kontrol et (aynı tenant, marka, model, yıl kombinasyonu)
                  const vehicleRepo: Repository<Vehicle> = AppDataSource.getRepository(Vehicle);
                  const existingVehicle = await vehicleRepo.findOne({
                    where: {
                      tenantId: tenant.id,
                      brandId: brand.id,
                      modelId: model.id,
                      year: year,
                      categoryId: category.id,
                    },
                  });

                  if (existingVehicle) {
                    vehiclesSkipped++;
                    continue;
                  }

                  // Engine bilgileri
                  const engineInfo = ENGINE_TEMPLATES[template.fuelType] || ENGINE_TEMPLATES[FuelType.GASOLINE];

                  // Araç oluştur
                  const vehicleInput: CreateVehicleInput = {
                    tenantId: tenant.id,
                    name: vehicleName,
                    categoryId: category.id,
                    brandId: brand.id,
                    modelId: model.id,
                    year: year,
                    transmission: template.transmission,
                    fuelType: template.fuelType,
                    seats: template.seats,
                    luggage: template.luggage,
                    doors: template.doors,
                    bodyType: template.bodyType,
                    engineSize: engineInfo.engineSize,
                    horsepower: engineInfo.horsepower,
                    hasAirConditioning: template.hasAirConditioning,
                    hasAbs: template.hasAbs,
                    hasRadio: template.hasRadio,
                    hasCd: template.hasCd || false,
                    hasSunroof: template.hasSunroof || false,
                    isFourWheelDrive: template.isFourWheelDrive || false,
                    baseRate: template.baseRate,
                    currencyCode: 'EUR',
                    description: `${categoryName} sınıfı ${brand.name} ${model.name} ${year} model araç.`,
                  };

                  await VehicleService.createVehicle(vehicleInput);
                  vehiclesCreated++;
                  console.log(`  ✅ Created: ${vehicleName} (${categoryName})`);
                } catch (error: any) {
                  if (error.message?.includes('already exists')) {
                    vehiclesSkipped++;
                  } else {
                    console.error(`  ❌ Error creating vehicle: ${error.message}`);
                  }
                }
              }
            }
          }
        }
      }

      console.log(`\n  📊 Tenant summary: ${vehiclesCreated} created, ${vehiclesSkipped} skipped`);
      totalVehiclesCreated += vehiclesCreated;
      totalVehiclesSkipped += vehiclesSkipped;
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Overall Summary:');
    console.log(`   Tenants processed: ${tenants.length}`);
    console.log(`   Total vehicles created: ${totalVehiclesCreated}`);
    console.log(`   Total vehicles skipped: ${totalVehiclesSkipped}`);
    console.log('='.repeat(60));
    console.log('\n✅ Vehicle variations seeding completed!');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Failed to seed vehicle variations:', error);
    process.exit(1);
  }
}

seedVehicleVariations();

