import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { PhoneCountry } from './phone-country.entity';
import { Language } from './language.entity';
import { Tour } from '../../tour/entities/tour.entity';
import { TourSession } from '../../tour/entities/tour-session.entity';

export enum ReservationType {
  TOUR = 'tour',
  RENTACAR = 'rentacar',
}

export enum ReservationStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

@Entity({ name: 'reservations' })
@Unique(['reference', 'tenantId'])
export class Reservation extends BaseEntity {
  @ManyToOne(() => Tenant, (tenant) => tenant.reservations, { nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant;

  @Column({ name: 'tenant_id' })
  tenantId!: string;

  @Column({ length: 40 })
  reference!: string;

  @Column({ type: 'enum', enum: ReservationType })
  type!: ReservationType;

  @Column({ type: 'enum', enum: ReservationStatus, default: ReservationStatus.PENDING })
  status!: ReservationStatus;

  @Column({ name: 'customer_name', length: 120 })
  customerName!: string;

  @Column({ name: 'customer_email', length: 160 })
  customerEmail!: string;

  @Column({ name: 'customer_phone', length: 32, nullable: true })
  customerPhone?: string;

  @ManyToOne(() => PhoneCountry, { nullable: true })
  @JoinColumn({ name: 'customer_phone_country_id' })
  customerPhoneCountry?: PhoneCountry | null;

  @Column({ name: 'customer_phone_country_id', nullable: true })
  customerPhoneCountryId?: string | null;

  @ManyToOne(() => Language, { nullable: true })
  @JoinColumn({ name: 'customer_language_id' })
  customerLanguage?: Language | null;

  @Column({ name: 'customer_language_id', nullable: true })
  customerLanguageId?: string | null;

  @Column({ name: 'check_in', type: 'timestamp', nullable: true })
  checkIn?: Date | null;

  @Column({ name: 'check_out', type: 'timestamp', nullable: true })
  checkOut?: Date | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown> | null;

  @ManyToOne(() => Tour, { nullable: true })
  @JoinColumn({ name: 'tour_id' })
  tour?: Tour | null;

  @Column({ name: 'tour_id', nullable: true })
  tourId?: string | null;

  @ManyToOne(() => TourSession, { nullable: true })
  @JoinColumn({ name: 'tour_session_id' })
  tourSession?: TourSession | null;

  @Column({ name: 'tour_session_id', nullable: true })
  tourSessionId?: string | null;
}
