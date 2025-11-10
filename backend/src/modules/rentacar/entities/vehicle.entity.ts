import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../shared/entities/base.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { VehiclePlate } from './vehicle-plate.entity';
import { VehiclePricingPeriod } from './vehicle-pricing-period.entity';

export enum TransmissionType {
  AUTOMATIC = 'automatic',
  MANUAL = 'manual',
}

export enum FuelType {
  GASOLINE = 'gasoline',
  DIESEL = 'diesel',
  HYBRID = 'hybrid',
  ELECTRIC = 'electric',
}

@Entity({ name: 'vehicles' })
export class Vehicle extends BaseEntity {
  @ManyToOne(() => Tenant, { nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant;

  @Column({ name: 'tenant_id' })
  tenantId!: string;

  @Column({ length: 120 })
  name!: string;

  @Column({ length: 80 })
  brand!: string;

  @Column({ length: 80 })
  model!: string;

  @Column({ type: 'int', nullable: true })
  year?: number;

  @Column({ type: 'enum', enum: TransmissionType, default: TransmissionType.AUTOMATIC })
  transmission!: TransmissionType;

  @Column({ type: 'enum', enum: FuelType, default: FuelType.GASOLINE })
  fuelType!: FuelType;

  @Column({ type: 'int', default: 4 })
  seats!: number;

  @Column({ type: 'int', default: 2 })
  luggage!: number;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'base_rate', type: 'decimal', precision: 10, scale: 2, default: 0 })
  baseRate!: number;

  @Column({ name: 'currency_code', length: 3, default: 'EUR' })
  currencyCode!: string;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @OneToMany(() => VehiclePlate, (plate) => plate.vehicle)
  plates!: VehiclePlate[];

  @OneToMany(() => VehiclePricingPeriod, (pricing) => pricing.vehicle)
  pricingPeriods!: VehiclePricingPeriod[];
}
