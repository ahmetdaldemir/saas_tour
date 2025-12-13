import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../shared/entities/base.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { TransferVehicle } from './transfer-vehicle.entity';
import { TransferRoute } from './transfer-route.entity';
import { TransferDriver } from './transfer-driver.entity';

export enum TransferReservationStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity({ name: 'transfer_reservations' })
export class TransferReservation extends BaseEntity {
  @ManyToOne(() => Tenant, { nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant;

  @Column({ name: 'tenant_id' })
  tenantId!: string;

  @Column({ length: 40, unique: true })
  reference!: string; // Rezervasyon kodu (örn: TRF-2024-001)

  @ManyToOne(() => TransferRoute, { nullable: false })
  @JoinColumn({ name: 'route_id' })
  route!: TransferRoute;

  @Column({ name: 'route_id' })
  routeId!: string;

  @ManyToOne(() => TransferVehicle, { nullable: false })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle!: TransferVehicle;

  @Column({ name: 'vehicle_id' })
  vehicleId!: string;

  @ManyToOne(() => TransferDriver, { nullable: true })
  @JoinColumn({ name: 'driver_id' })
  driver?: TransferDriver | null;

  @Column({ name: 'driver_id', nullable: true })
  driverId?: string | null;

  @Column({ type: 'enum', enum: TransferReservationStatus, default: TransferReservationStatus.PENDING })
  status!: TransferReservationStatus;

  // Yolcu bilgileri
  @Column({ name: 'passenger_name', length: 120 })
  passengerName!: string;

  @Column({ name: 'passenger_email', length: 160 })
  passengerEmail!: string;

  @Column({ name: 'passenger_phone', length: 32 })
  passengerPhone!: string;

  @Column({ name: 'passenger_count', type: 'int' })
  passengerCount!: number;

  @Column({ name: 'luggage_count', type: 'int', default: 0 })
  luggageCount!: number;

  // Tarih & Saat
  @Column({ name: 'transfer_date', type: 'date' })
  transferDate!: Date;

  @Column({ name: 'transfer_time', type: 'time' })
  transferTime!: string; // HH:mm format

  @Column({ name: 'pickup_address', length: 300, nullable: true })
  pickupAddress?: string;

  @Column({ name: 'dropoff_address', length: 300, nullable: true })
  dropoffAddress?: string;

  // Uçuş bilgileri (opsiyonel)
  @Column({ name: 'flight_number', length: 20, nullable: true })
  flightNumber?: string;

  @Column({ name: 'flight_arrival_time', type: 'timestamp', nullable: true })
  flightArrivalTime?: Date;

  @Column({ name: 'flight_departure_time', type: 'timestamp', nullable: true })
  flightDepartureTime?: Date;

  // Fiyatlandırma
  @Column({ name: 'base_price', type: 'decimal', precision: 10, scale: 2 })
  basePrice!: number;

  @Column({ name: 'extra_service_price', type: 'decimal', precision: 10, scale: 2, default: 0 })
  extraServicePrice!: number;

  @Column({ name: 'total_price', type: 'decimal', precision: 10, scale: 2 })
  totalPrice!: number;

  @Column({ name: 'currency_code', length: 3, default: 'EUR' })
  currencyCode!: string;

  @Column({ name: 'is_round_trip', default: false })
  isRoundTrip!: boolean;

  @Column({ name: 'is_night_rate', default: false })
  isNightRate!: boolean;

  // Ek hizmetler
  @Column({ name: 'extra_services', type: 'jsonb', nullable: true })
  extraServices?: Record<string, any>; // { "baby_seat": true, "waiting_time": 30 }

  // Ödeme durumu
  @Column({ name: 'payment_status', length: 20, default: 'pending' })
  paymentStatus!: string; // pending, paid, refunded

  @Column({ name: 'payment_method', length: 50, nullable: true })
  paymentMethod?: string;

  // Notlar
  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'customer_notes', type: 'text', nullable: true })
  customerNotes?: string;
}

