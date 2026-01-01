import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../shared/entities/base.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Reservation } from '../../shared/entities/reservation.entity';

export enum OpsTaskType {
  CHECKOUT = 'checkout',
  RETURN = 'return',
}

export enum OpsTaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity({ name: 'ops_tasks' })
export class OpsTask extends BaseEntity {
  @ManyToOne(() => Tenant, { nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant;

  @Column({ name: 'tenant_id' })
  tenantId!: string;

  @ManyToOne(() => Reservation, { nullable: false })
  @JoinColumn({ name: 'reservation_id' })
  reservation!: Reservation;

  @Column({ name: 'reservation_id' })
  reservationId!: string;

  @Column({ type: 'enum', enum: OpsTaskType })
  type!: OpsTaskType;

  @Column({ type: 'enum', enum: OpsTaskStatus, default: OpsTaskStatus.PENDING })
  status!: OpsTaskStatus;

  // Media references (stored as JSON array of media IDs)
  @Column({ type: 'jsonb', nullable: true })
  mediaIds?: string[];

  // Document verification
  @Column({ name: 'license_verified', default: false })
  licenseVerified!: boolean;

  @Column({ name: 'license_media_ids', type: 'jsonb', nullable: true })
  licenseMediaIds?: string[];

  @Column({ name: 'passport_verified', default: false })
  passportVerified!: boolean;

  @Column({ name: 'passport_media_ids', type: 'jsonb', nullable: true })
  passportMediaIds?: string[];

  // Return-specific fields
  @Column({ name: 'return_fuel_level', type: 'decimal', precision: 5, scale: 2, nullable: true })
  returnFuelLevel?: number;

  @Column({ name: 'return_mileage', type: 'int', nullable: true })
  returnMileage?: number;

  @Column({ name: 'return_damage_notes', type: 'text', nullable: true })
  returnDamageNotes?: string;

  @Column({ name: 'return_damage_media_ids', type: 'jsonb', nullable: true })
  returnDamageMediaIds?: string[];

  // Completed by user
  @Column({ name: 'completed_by_user_id', nullable: true })
  completedByUserId?: string;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt?: Date;
}

