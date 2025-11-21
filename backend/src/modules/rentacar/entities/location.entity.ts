import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../shared/entities/base.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { LocationTranslation } from './location-translation.entity';

export enum LocationType {
  MERKEZ = 'merkez',
  OTEL = 'otel',
  HAVALIMANI = 'havalimani',
  ADRES = 'adres',
}

@Entity({ name: 'rentacar_locations' })
export class Location extends BaseEntity {
  @ManyToOne(() => Tenant, { nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant;

  @Column({ name: 'tenant_id' })
  tenantId!: string;

  @Column({ length: 80, nullable: true })
  province?: string;

  @Column({ length: 80, nullable: true })
  district?: string;

  @Column({ name: 'parent_region', length: 200, nullable: true })
  parentRegion?: string;

  @Column({ type: 'enum', enum: LocationType, default: LocationType.MERKEZ })
  type!: LocationType;

  @Column({ name: 'order_no', type: 'int', default: 1000 })
  orderNo!: number;

  @Column({ name: 'delivery_fee', type: 'decimal', precision: 10, scale: 2, default: 0 })
  deliveryFee!: number;

  @Column({ name: 'drop_fee', type: 'decimal', precision: 10, scale: 2, default: 0 })
  dropFee!: number;

  @Column({ name: 'min_day_count', type: 'int', nullable: true })
  minDayCount?: number;

  @Column({ name: 'currency_code', length: 3, default: 'TRY' })
  currencyCode!: string;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @OneToMany(() => LocationTranslation, (translation) => translation.location, { cascade: true })
  translations!: LocationTranslation[];
}

