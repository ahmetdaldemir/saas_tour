import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../shared/entities/base.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { TransferPricing } from './transfer-pricing.entity';
import { TransferReservation } from './transfer-reservation.entity';

export enum TransferVehicleType {
  VIP = 'vip',
  SHUTTLE = 'shuttle',
  PREMIUM = 'premium',
  LUXURY = 'luxury',
}

export enum TransferVehicleFeature {
  WIFI = 'wifi',
  BABY_SEAT = 'baby_seat',
  DRINKS = 'drinks',
  NEWSPAPER = 'newspaper',
  CHARGER = 'charger',
  GPS = 'gps',
  MULTILINGUAL_DRIVER = 'multilingual_driver',
}

@Entity({ name: 'transfer_vehicles' })
export class TransferVehicle extends BaseEntity {
  @ManyToOne(() => Tenant, { nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant;

  @Column({ name: 'tenant_id' })
  tenantId!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'enum', enum: TransferVehicleType, default: TransferVehicleType.VIP })
  type!: TransferVehicleType;

  @Column({ name: 'passenger_capacity', type: 'int' })
  passengerCapacity!: number;

  @Column({ name: 'luggage_capacity', type: 'int' })
  luggageCapacity!: number;

  @Column({ name: 'has_driver', default: true })
  hasDriver!: boolean; // Transfer araçları varsayılan olarak şoförlü

  @Column({ type: 'simple-array', nullable: true })
  features?: TransferVehicleFeature[]; // Wi-Fi, Bebek Koltuğu, İçecek, vb.

  @Column({ name: 'image_url', type: 'varchar', length: 500, nullable: true })
  imageUrl?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;

  @OneToMany(() => TransferPricing, (pricing) => pricing.vehicle)
  pricings!: TransferPricing[];

  @OneToMany(() => TransferReservation, (reservation) => reservation.vehicle)
  reservations!: TransferReservation[];
}

