import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../shared/entities/base.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';

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

  @Column({ length: 200 })
  name!: string;

  @Column({ name: 'meta_title', length: 200, nullable: true })
  metaTitle?: string;

  @ManyToOne(() => Location, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent?: Location | null;

  @Column({ name: 'parent_id', nullable: true })
  parentId?: string | null;

  @OneToMany(() => Location, (location) => location.parent)
  children!: Location[];

  @Column({ type: 'enum', enum: LocationType, default: LocationType.MERKEZ })
  type!: LocationType;

  @Column({ type: 'int', default: 0 })
  sort!: number;

  @Column({ name: 'delivery_fee', type: 'decimal', precision: 10, scale: 2, default: 0 })
  deliveryFee!: number;

  @Column({ name: 'drop_fee', type: 'decimal', precision: 10, scale: 2, default: 0 })
  dropFee!: number;

  @Column({ name: 'min_day_count', type: 'int', nullable: true })
  minDayCount?: number;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;
}

