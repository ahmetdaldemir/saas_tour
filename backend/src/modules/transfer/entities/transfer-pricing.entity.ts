import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../shared/entities/base.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { TransferVehicle } from './transfer-vehicle.entity';
import { TransferRoute } from './transfer-route.entity';

export enum PricingModel {
  FIXED = 'fixed', // Sabit fiyat
  PER_KM = 'per_km', // Km bazlı
  PER_HOUR = 'per_hour', // Saatlik
  PER_VEHICLE_TYPE = 'per_vehicle_type', // Araç tipine göre
}

@Entity({ name: 'transfer_pricings' })
@Unique(['tenantId', 'vehicleId', 'routeId', 'isRoundTrip', 'isNightRate'])
export class TransferPricing extends BaseEntity {
  @ManyToOne(() => Tenant, { nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant;

  @Column({ name: 'tenant_id' })
  tenantId!: string;

  @ManyToOne(() => TransferVehicle, { nullable: false })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle!: TransferVehicle;

  @Column({ name: 'vehicle_id' })
  vehicleId!: string;

  @ManyToOne(() => TransferRoute, { nullable: false })
  @JoinColumn({ name: 'route_id' })
  route!: TransferRoute;

  @Column({ name: 'route_id' })
  routeId!: string;

  @Column({ type: 'enum', enum: PricingModel, default: PricingModel.FIXED })
  pricingModel!: PricingModel;

  @Column({ name: 'base_price', type: 'decimal', precision: 10, scale: 2 })
  basePrice!: number;

  @Column({ name: 'currency_code', length: 3, default: 'EUR' })
  currencyCode!: string;

  @Column({ name: 'is_round_trip', default: false })
  isRoundTrip!: boolean; // true = Gidiş-Dönüş, false = Tek Yön

  @Column({ name: 'is_night_rate', default: false })
  isNightRate!: boolean; // Gece tarifesi (örn: 22:00-06:00)

  @Column({ name: 'night_rate_surcharge', type: 'decimal', precision: 10, scale: 2, nullable: true })
  nightRateSurcharge?: number; // Gece tarifesi ek ücreti

  @Column({ name: 'extra_service_prices', type: 'jsonb', nullable: true })
  extraServicePrices?: Record<string, number>; // { "baby_seat": 10, "waiting_time": 15 }

  @Column({ name: 'min_passengers', type: 'int', nullable: true })
  minPassengers?: number;

  @Column({ name: 'max_passengers', type: 'int', nullable: true })
  maxPassengers?: number;

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ type: 'text', nullable: true })
  notes?: string;
}

