import 'reflect-metadata';
import { AppDataSource } from '../config/data-source';

const TENANT_ID = '30119880-b233-4896-b612-1463e32617f2';

async function fixDestinationsTenantSync() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      // Check if tenant_id column exists
      const table = await queryRunner.getTable('destinations');
      const tenantIdColumn = table?.findColumnByName('tenant_id');

      if (!tenantIdColumn) {
        console.log('⚠️  tenant_id column does not exist yet. It will be added by synchronize.');
        await queryRunner.release();
        await AppDataSource.destroy();
        process.exit(0);
      }

      // Check if there are NULL values
      const nullCountResult = await queryRunner.query(`
        SELECT COUNT(*) as count 
        FROM destinations 
        WHERE tenant_id IS NULL
      `);
      const nullCount = parseInt(nullCountResult[0].count);

      if (nullCount === 0) {
        console.log('✅ All destinations already have tenant_id');
        
        // Check if column is nullable
        if (tenantIdColumn.isNullable) {
          console.log('🔄 Setting tenant_id to NOT NULL...');
          
          // First, ensure all records have tenant_id
          await queryRunner.query(`
            UPDATE destinations 
            SET tenant_id = $1 
            WHERE tenant_id IS NULL
          `, [TENANT_ID]);
          
          // Then set to NOT NULL
          await queryRunner.query(`
            ALTER TABLE destinations 
            ALTER COLUMN tenant_id SET NOT NULL
          `);
          
          console.log('✅ tenant_id column set to NOT NULL');
        } else {
          console.log('✅ tenant_id column is already NOT NULL');
        }
      } else {
        console.log(`📝 Found ${nullCount} destination(s) with NULL tenant_id`);
        
        // Update NULL values
        await queryRunner.query(`
          UPDATE destinations 
          SET tenant_id = $1 
          WHERE tenant_id IS NULL
        `, [TENANT_ID]);
        
        console.log(`✅ Updated ${nullCount} destination(s) with tenant_id`);
        
        // If column is nullable, set to NOT NULL
        if (tenantIdColumn.isNullable) {
          console.log('🔄 Setting tenant_id to NOT NULL...');
          await queryRunner.query(`
            ALTER TABLE destinations 
            ALTER COLUMN tenant_id SET NOT NULL
          `);
          console.log('✅ tenant_id column set to NOT NULL');
        }
      }

      // Ensure foreign key constraint exists
      const foreignKeys = table?.foreignKeys || [];
      const fkExists = foreignKeys.some(fk =>
        fk.columnNames.includes('tenant_id') && fk.referencedTableName === 'tenants'
      );

      if (!fkExists) {
        console.log('🔄 Adding foreign key constraint...');
        await queryRunner.query(`
          ALTER TABLE destinations 
          ADD CONSTRAINT FK_destinations_tenant_id 
          FOREIGN KEY (tenant_id) 
          REFERENCES tenants(id) 
          ON DELETE CASCADE
        `);
        console.log('✅ Foreign key constraint added');
      } else {
        console.log('✅ Foreign key constraint already exists');
      }

      await queryRunner.release();
      console.log('✅ Done');
    } catch (error) {
      await queryRunner.release();
      throw error;
    } finally {
      await AppDataSource.destroy();
    }
  } catch (error) {
    console.error('❌ Fix failed:', error);
    await AppDataSource.destroy();
    process.exit(1);
  }
}

fixDestinationsTenantSync();

