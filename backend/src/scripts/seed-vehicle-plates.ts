import 'reflect-metadata';
import { AppDataSource } from '../config/data-source';
import { Tenant, TenantCategory } from '../modules/tenants/entities/tenant.entity';
import { VehicleService, CreatePlateInput } from '../modules/rentacar/services/vehicle.service';
import { Vehicle } from '../modules/rentacar/entities/vehicle.entity';
import { VehiclePlate } from '../modules/rentacar/entities/vehicle-plate.entity';
import { Repository } from 'typeorm';

/**
 * Tüm araçlara plaka verisi ekler
 * Kullanım: npm run seed:vehicle-plates
 */

// Türkiye plaka formatı: XX YY ZZZ (örn: 34 ABC 123)
const TURKISH_PLATE_REGIONS = [
  '01', '02', '03', '04', '05', '06', '07', '08', '09', '10',
  '11', '12', '13', '14', '15', '16', '17', '18', '19', '20',
  '21', '22', '23', '24', '25', '26', '27', '28', '29', '30',
  '31', '32', '33', '34', '35', '36', '37', '38', '39', '40',
  '41', '42', '43', '44', '45', '46', '47', '48', '49', '50',
  '51', '52', '53', '54', '55', '56', '57', '58', '59', '60',
  '61', '62', '63', '64', '65', '66', '67', '68', '69', '70',
  '71', '72', '73', '74', '75', '76', '77', '78', '79', '80', '81',
];

const LETTERS = 'ABCDEFGHIJKLMNOPRSTUVYZ'; // Q, W, X yok
const NUMBERS = '0123456789';

function generatePlateNumber(regionCode: string): string {
  // Format: XX YY ZZZ (örn: 34 ABC 123)
  const letter1 = LETTERS[Math.floor(Math.random() * LETTERS.length)];
  const letter2 = LETTERS[Math.floor(Math.random() * LETTERS.length)];
  const letter3 = LETTERS[Math.floor(Math.random() * LETTERS.length)];
  const num1 = NUMBERS[Math.floor(Math.random() * NUMBERS.length)];
  const num2 = NUMBERS[Math.floor(Math.random() * NUMBERS.length)];
  const num3 = NUMBERS[Math.floor(Math.random() * NUMBERS.length)];
  
  return `${regionCode} ${letter1}${letter2}${letter3} ${num1}${num2}${num3}`;
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function seedVehiclePlates() {
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

    const vehicleRepo: Repository<Vehicle> = AppDataSource.getRepository(Vehicle);
    let totalPlatesCreated = 0;
    let totalPlatesSkipped = 0;

    for (const tenant of tenants) {
      console.log(`\n🏢 Processing tenant: ${tenant.name} (${tenant.slug})`);

      // Bu tenant'a ait tüm araçları al
      const vehicles = await vehicleRepo.find({
        where: { tenantId: tenant.id },
      });

      if (vehicles.length === 0) {
        console.log(`  ⚠️  No vehicles found for tenant ${tenant.name}. Skipping.`);
        continue;
      }

      console.log(`  📦 Found ${vehicles.length} vehicle(s)`);

      let platesCreated = 0;
      let platesSkipped = 0;

      for (const vehicle of vehicles) {
        try {
          // Araç için zaten plaka var mı kontrol et
          const plateRepo = AppDataSource.getRepository(VehiclePlate);
          const existingPlates = await plateRepo.find({
            where: { vehicleId: vehicle.id },
          });

          if (existingPlates.length > 0) {
            platesSkipped++;
            continue; // Bu araç için zaten plaka var
          }

          // Her araç için 1 plaka oluştur
          const regionCode = TURKISH_PLATE_REGIONS[Math.floor(Math.random() * TURKISH_PLATE_REGIONS.length)];
          const plateNumber = generatePlateNumber(regionCode);

          // Rastgele tarihler (son 3 yıl içinde)
          const now = new Date();
          const threeYearsAgo = new Date(now.getFullYear() - 3, 0, 1);
          const registrationDate = randomDate(threeYearsAgo, now);

          // Plaka verisi oluştur
          const plateInput: CreatePlateInput = {
            vehicleId: vehicle.id,
            plateNumber: plateNumber,
            registrationDate: registrationDate.toISOString().split('T')[0], // YYYY-MM-DD format
            documentNumber: `DOC-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
            serialNumber: `SER-${Math.random().toString(36).substring(2, 12).toUpperCase()}`,
            km: Math.floor(Math.random() * 50000) + 1000, // 1000-51000 km
            oilKm: Math.floor(Math.random() * 10000) + 5000, // 5000-15000 km (son yağ değişimi)
            description: `${vehicle.name} için plaka`,
            comprehensiveInsuranceCompany: ['Allianz', 'Anadolu Sigorta', 'AXA Sigorta', 'Groupama Sigorta'][Math.floor(Math.random() * 4)],
            comprehensiveInsuranceStart: randomDate(threeYearsAgo, now).toISOString().split('T')[0],
            comprehensiveInsuranceEnd: new Date(new Date().getFullYear() + 1, 11, 31).toISOString().split('T')[0], // Bir yıl sonra
            trafficInsuranceCompany: ['Allianz', 'Anadolu Sigorta', 'AXA Sigorta', 'Groupama Sigorta'][Math.floor(Math.random() * 4)],
            trafficInsuranceStart: randomDate(threeYearsAgo, now).toISOString().split('T')[0],
            trafficInsuranceEnd: new Date(new Date().getFullYear() + 1, 11, 31).toISOString().split('T')[0],
            inspectionCompany: 'TÜVTÜRK',
            inspectionStart: randomDate(threeYearsAgo, now).toISOString().split('T')[0],
            inspectionEnd: new Date(now.getFullYear() + 1, 11, 31).toISOString().split('T')[0], // Bir yıl sonra
            exhaustInspectionCompany: 'TÜVTÜRK',
            exhaustInspectionStart: randomDate(threeYearsAgo, now).toISOString().split('T')[0],
            exhaustInspectionEnd: new Date(now.getFullYear() + 1, 11, 31).toISOString().split('T')[0],
          };

          await VehicleService.addPlate(plateInput);
          platesCreated++;
          console.log(`  ✅ Created plate ${plateNumber} for vehicle: ${vehicle.name}`);
        } catch (error: any) {
          if (error.message?.includes('already exists') || error.message?.includes('already assigned')) {
            platesSkipped++;
            console.log(`  ⏭️  Plate already exists for vehicle: ${vehicle.name}`);
          } else {
            console.error(`  ❌ Error creating plate for vehicle ${vehicle.name}:`, error.message);
          }
        }
      }

      console.log(`\n  📊 Tenant summary: ${platesCreated} created, ${platesSkipped} skipped`);
      totalPlatesCreated += platesCreated;
      totalPlatesSkipped += platesSkipped;
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Overall Summary:');
    console.log(`   Tenants processed: ${tenants.length}`);
    console.log(`   Total plates created: ${totalPlatesCreated}`);
    console.log(`   Total plates skipped: ${totalPlatesSkipped}`);
    console.log('='.repeat(60));
    console.log('\n✅ Vehicle plates seeding completed!');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Failed to seed vehicle plates:', error);
    process.exit(1);
  }
}

seedVehiclePlates();

