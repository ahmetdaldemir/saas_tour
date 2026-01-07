import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from 'typeorm';

export class CreateActivityLogs1736245200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create activity_logs table
    await queryRunner.createTable(
      new Table({
        name: 'activity_logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'gen_random_uuid()',
          },
          {
            name: 'tenant_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'now()',
          },
          {
            name: 'module',
            type: 'varchar',
            length: '64',
          },
          {
            name: 'action',
            type: 'varchar',
            length: '64',
          },
          {
            name: 'severity',
            type: 'varchar',
            length: '16',
            default: "'info'",
          },
          {
            name: 'status',
            type: 'varchar',
            length: '16',
            default: "'success'",
          },
          {
            name: 'actor_type',
            type: 'varchar',
            length: '16',
            isNullable: true,
          },
          {
            name: 'actor_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'actor_label',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'entity_type',
            type: 'varchar',
            length: '64',
            isNullable: true,
          },
          {
            name: 'entity_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'entity_label',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'message',
            type: 'text',
          },
          {
            name: 'request_id',
            type: 'varchar',
            length: '64',
            isNullable: true,
          },
          {
            name: 'correlation_id',
            type: 'varchar',
            length: '64',
            isNullable: true,
          },
          {
            name: 'ip',
            type: 'inet',
            isNullable: true,
          },
          {
            name: 'user_agent',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'path',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'method',
            type: 'varchar',
            length: '16',
            isNullable: true,
          },
          {
            name: 'http_status',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'duration_ms',
            type: 'int',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            default: "'{}'::jsonb",
          },
          {
            name: 'before',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'after',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'diff',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'error_code',
            type: 'varchar',
            length: '64',
            isNullable: true,
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'stack_trace',
            type: 'text',
            isNullable: true,
          },
        ],
      }),
      true
    );

    // Create foreign key to tenants
    await queryRunner.createForeignKey(
      'activity_logs',
      new TableForeignKey({
        columnNames: ['tenant_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'tenants',
        onDelete: 'CASCADE',
      })
    );

    // Create composite indexes
    await queryRunner.createIndex(
      'activity_logs',
      new TableIndex({
        name: 'IDX_activity_logs_tenant_created',
        columnNames: ['tenant_id', 'created_at'],
        where: 'tenant_id IS NOT NULL',
      })
    );

    await queryRunner.createIndex(
      'activity_logs',
      new TableIndex({
        name: 'IDX_activity_logs_module_created',
        columnNames: ['module', 'created_at'],
      })
    );

    await queryRunner.createIndex(
      'activity_logs',
      new TableIndex({
        name: 'IDX_activity_logs_action_created',
        columnNames: ['action', 'created_at'],
      })
    );

    await queryRunner.createIndex(
      'activity_logs',
      new TableIndex({
        name: 'IDX_activity_logs_severity_created',
        columnNames: ['severity', 'created_at'],
      })
    );

    await queryRunner.createIndex(
      'activity_logs',
      new TableIndex({
        name: 'IDX_activity_logs_status_created',
        columnNames: ['status', 'created_at'],
      })
    );

    await queryRunner.createIndex(
      'activity_logs',
      new TableIndex({
        name: 'IDX_activity_logs_actor_created',
        columnNames: ['actor_id', 'created_at'],
        where: 'actor_id IS NOT NULL',
      })
    );

    await queryRunner.createIndex(
      'activity_logs',
      new TableIndex({
        name: 'IDX_activity_logs_entity',
        columnNames: ['entity_type', 'entity_id'],
        where: 'entity_type IS NOT NULL AND entity_id IS NOT NULL',
      })
    );

    await queryRunner.createIndex(
      'activity_logs',
      new TableIndex({
        name: 'IDX_activity_logs_request_id',
        columnNames: ['request_id'],
        where: 'request_id IS NOT NULL',
      })
    );

    await queryRunner.createIndex(
      'activity_logs',
      new TableIndex({
        name: 'IDX_activity_logs_correlation_id',
        columnNames: ['correlation_id'],
        where: 'correlation_id IS NOT NULL',
      })
    );

    // Create GIN index for JSONB metadata (PostgreSQL-specific)
    await queryRunner.query(`
      CREATE INDEX "IDX_activity_logs_metadata_gin" ON "activity_logs" USING GIN ("metadata");
    `);

    // Create GIN index for full-text search on message
    await queryRunner.query(`
      CREATE INDEX "IDX_activity_logs_message_search" ON "activity_logs" USING GIN (to_tsvector('english', message));
    `);

    // Create index on created_at for retention cleanup
    await queryRunner.createIndex(
      'activity_logs',
      new TableIndex({
        name: 'IDX_activity_logs_created_at',
        columnNames: ['created_at'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('activity_logs');
  }
}

