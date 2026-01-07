import { Entity, Column, Index, CreateDateColumn } from 'typeorm';
import { BaseEntity } from '../../shared/entities/base.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { ManyToOne, JoinColumn } from 'typeorm';

export enum ActivityLogSeverity {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export enum ActivityLogStatus {
  SUCCESS = 'success',
  FAILURE = 'failure',
}

export enum ActorType {
  USER = 'user',
  CUSTOMER = 'customer',
  SYSTEM = 'system',
}

@Entity({ name: 'activity_logs' })
@Index(['tenantId', 'createdAt'], { where: 'tenant_id IS NOT NULL' })
@Index(['module', 'createdAt'])
@Index(['action', 'createdAt'])
@Index(['severity', 'createdAt'])
@Index(['status', 'createdAt'])
@Index(['actorId', 'createdAt'], { where: 'actor_id IS NOT NULL' })
@Index(['entityType', 'entityId'], { where: 'entity_type IS NOT NULL AND entity_id IS NOT NULL' })
@Index(['requestId'], { where: 'request_id IS NOT NULL' })
@Index(['correlationId'], { where: 'correlation_id IS NOT NULL' })
// GIN index for JSONB metadata (PostgreSQL-specific)
@Index('IDX_activity_logs_metadata_gin', { synchronize: false }) // Created manually in migration
// Full-text search on message
@Index('IDX_activity_logs_message_search', { synchronize: false }) // GIN index with to_tsvector
export class ActivityLog extends BaseEntity {
  @ManyToOne(() => Tenant, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant?: Tenant | null;

  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  tenantId?: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  // Module & Action
  @Column({ type: 'varchar', length: 64 })
  module!: string; // auth, reservations, vehicles, operations, payments, users, settings, integrations, files, api

  @Column({ type: 'varchar', length: 64 })
  action!: string; // create, update, delete, checkout, checkin, login, logout, payment_attempt, upload, request

  // Severity & Status
  @Column({ type: 'varchar', length: 16, default: ActivityLogSeverity.INFO })
  severity!: ActivityLogSeverity;

  @Column({ type: 'varchar', length: 16, default: ActivityLogStatus.SUCCESS })
  status!: ActivityLogStatus;

  // Actor (who performed the action)
  @Column({ name: 'actor_type', type: 'varchar', length: 16, nullable: true })
  actorType?: ActorType | null;

  @Column({ name: 'actor_id', type: 'uuid', nullable: true })
  actorId?: string | null;

  @Column({ name: 'actor_label', type: 'varchar', length: 255, nullable: true })
  actorLabel?: string | null; // Snapshot: name/email

  // Entity (what was acted upon)
  @Column({ name: 'entity_type', type: 'varchar', length: 64, nullable: true })
  entityType?: string | null; // Reservation, Vehicle, Customer, Payment, etc.

  @Column({ name: 'entity_id', type: 'uuid', nullable: true })
  entityId?: string | null;

  @Column({ name: 'entity_label', type: 'varchar', length: 255, nullable: true })
  entityLabel?: string | null; // Snapshot: code, plate, name

  // Message
  @Column({ type: 'text' })
  message!: string;

  // Request Context
  @Column({ name: 'request_id', type: 'varchar', length: 64, nullable: true })
  requestId?: string | null;

  @Column({ name: 'correlation_id', type: 'varchar', length: 64, nullable: true })
  correlationId?: string | null;

  @Column({ type: 'inet', nullable: true })
  ip?: string | null;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent?: string | null;

  @Column({ type: 'text', nullable: true })
  path?: string | null;

  @Column({ type: 'varchar', length: 16, nullable: true })
  method?: string | null; // GET, POST, PUT, DELETE, PATCH

  @Column({ name: 'http_status', type: 'int', nullable: true })
  httpStatus?: number | null;

  @Column({ name: 'duration_ms', type: 'int', nullable: true })
  durationMs?: number | null;

  // Data (sanitized)
  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  before?: Record<string, any> | null;

  @Column({ type: 'jsonb', nullable: true })
  after?: Record<string, any> | null;

  @Column({ type: 'jsonb', nullable: true })
  diff?: Record<string, any> | null; // Only changed fields

  // Error Details
  @Column({ name: 'error_code', type: 'varchar', length: 64, nullable: true })
  errorCode?: string | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string | null;

  @Column({ name: 'stack_trace', type: 'text', nullable: true })
  stackTrace?: string | null; // Truncated to ~10k chars, admin-only access
}

