import 'reflect-metadata';
import { AppDataSource } from '../config/data-source';
import { Tenant } from '../modules/tenants/entities/tenant.entity';
import { LocationService } from '../modules/rentacar/services/location.service';
import { LocationType } from '../modules/rentacar/entities/location.entity';

/**
 * Türkiye'deki tüm illerin alt bölgelerini ekler
 * Her il için: "{İl Adı} Otel", "{İl Adı} Havalimanı", "{İl Adı} Merkez"
 * Tüm tenant'lar için eklenir
 * Kullanım: npm run seed:province-sub-locations
 */

async function seedTurkeyProvinceSubLocations() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    const tenantRepo = AppDataSource.getRepository(Tenant);
    const tenants = await tenantRepo.findOne({ where: { id: '9930c947-f720-463c-ba1d-e1af921d5ffb' } });


    if (!tenants) {
      console.log('⚠️  No tenants found. Please create at least one tenant first.');
      await AppDataSource.destroy();
      return;
    }

    console.log(`📋 Found ${tenants?.name} tenant(s). Adding sub-locations for all provinces...\n`);

    let totalSubLocationsCreated = 0;
    let totalSubLocationsSkipped = 0;

      // Get all top-level locations (provinces) for this tenant
      const allLocations = await LocationService.list('9930c947-f720-463c-ba1d-e1af921d5ffb');
      const provinces = allLocations.filter((loc) => loc.parentId === null);

      if (provinces.length === 0) {
        console.log(`  ⚠️  No provinces found for this tenant. Please run seed:provinces first.`);
        await AppDataSource.destroy();
        return;
      }

      console.log(`  📍 Found ${provinces.length} provinces`);

      let subLocationsCreated = 0;
      let subLocationsSkipped = 0;

      for (const province of provinces) {
        const subLocationTypes = [
          { name: `${province.name} Otel`, type: LocationType.OTEL, sort: 1 },
          { name: `${province.name} Havalimanı`, type: LocationType.HAVALIMANI, sort: 2 },
          { name: `${province.name} Merkez`, type: LocationType.MERKEZ, sort: 3 },
        ];

        for (const subLocation of subLocationTypes) {
          try {
            // Check if sub-location already exists
            const existingLocations = await LocationService.list('9930c947-f720-463c-ba1d-e1af921d5ffb');
            const exists = existingLocations.some(
              (loc) =>
                loc.name === subLocation.name &&
                loc.parentId === province.id &&
                loc.type === subLocation.type
            );

            if (exists) {
              subLocationsSkipped++;
              console.log(`    ⏭️  ${subLocation.name} already exists`);
              continue;
            }

            // Create sub-location
            await LocationService.create({
              tenantId: '9930c947-f720-463c-ba1d-e1af921d5ffb',
              name: subLocation.name,
              metaTitle: `${subLocation.name} Araç Kiralama`,
              parentId: province.id, // Parent is the province
              type: subLocation.type,
              sort: subLocation.sort,
              deliveryFee: 0,
              dropFee: 0,
              isActive: true,
            });

            subLocationsCreated++;
            console.log(`    ✅ Created: ${subLocation.name} (${subLocation.type})`);
          } catch (error: any) {
            console.error(`    ❌ Error creating ${subLocation.name}:`, error.message);
            // Continue with next sub-location even if one fails
          }
        }
      }

      console.log(`\n  📊 Tenant summary: ${subLocationsCreated} created, ${subLocationsSkipped} skipped`);
      totalSubLocationsCreated += subLocationsCreated;
    totalSubLocationsSkipped += subLocationsSkipped;

    console.log('\n' + '='.repeat(60));
    console.log('📊 Overall Summary:');
    console.log(`   Tenants processed: ${tenants?.name}`);
    console.log(`   Total sub-locations created: ${totalSubLocationsCreated}`);
    console.log(`   Total sub-locations skipped: ${totalSubLocationsSkipped}`);
    console.log(`   Expected: ~${81 * 3} sub-locations (81 provinces × 3 types)`);
    console.log('='.repeat(60));
    console.log('\n✅ Turkey province sub-locations seeding completed!');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Failed to seed Turkey province sub-locations:', error);
    process.exit(1);
  }
}

seedTurkeyProvinceSubLocations();

