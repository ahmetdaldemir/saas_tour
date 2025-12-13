import { Repository, Like, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { AppDataSource } from '../../../config/data-source';
import { TransferReservation, TransferReservationStatus } from '../entities/transfer-reservation.entity';
import { TransferPricingService } from './transfer-pricing.service';

export type CreateTransferReservationInput = {
  tenantId: string;
  routeId: string;
  vehicleId: string;
  driverId?: string;
  passengerName: string;
  passengerEmail: string;
  passengerPhone: string;
  passengerCount: number;
  luggageCount?: number;
  transferDate: string; // ISO date string
  transferTime: string; // HH:mm
  pickupAddress?: string;
  dropoffAddress?: string;
  flightNumber?: string;
  flightArrivalTime?: string;
  flightDepartureTime?: string;
  isRoundTrip?: boolean;
  extraServices?: Record<string, any>;
  notes?: string;
  customerNotes?: string;
};

export type UpdateTransferReservationInput = Partial<CreateTransferReservationInput> & {
  status?: TransferReservationStatus;
  driverId?: string | null;
  paymentStatus?: string;
  paymentMethod?: string;
};

export type TransferReservationFilters = {
  tenantId: string;
  status?: TransferReservationStatus;
  vehicleId?: string;
  routeId?: string;
  driverId?: string;
  dateFrom?: string;
  dateTo?: string;
};

export class TransferReservationService {
  private static reservationRepo(): Repository<TransferReservation> {
    return AppDataSource.getRepository(TransferReservation);
  }

  /**
   * Generate unique reservation reference (TRF-YYYY-XXXXX)
   */
  private static async generateReference(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.reservationRepo().count({
      where: {
        reference: Like(`TRF-${year}-%`),
      },
    });
    const sequence = String(count + 1).padStart(5, '0');
    return `TRF-${year}-${sequence}`;
  }

  static async list(filters: TransferReservationFilters): Promise<TransferReservation[]> {
    const where: any = { tenantId: filters.tenantId };

    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.vehicleId) {
      where.vehicleId = filters.vehicleId;
    }
    if (filters.routeId) {
      where.routeId = filters.routeId;
    }
    if (filters.driverId) {
      where.driverId = filters.driverId;
    }
    if (filters.dateFrom || filters.dateTo) {
      where.transferDate = {};
      if (filters.dateFrom) {
        where.transferDate = MoreThanOrEqual(new Date(filters.dateFrom));
      }
      if (filters.dateTo) {
        where.transferDate = LessThanOrEqual(new Date(filters.dateTo));
      }
    }

    return this.reservationRepo().find({
      where,
      relations: ['vehicle', 'route', 'route.points', 'driver'],
      order: { transferDate: 'DESC', createdAt: 'DESC' },
    });
  }

  static async getById(id: string, tenantId: string): Promise<TransferReservation | null> {
    return this.reservationRepo().findOne({
      where: { id, tenantId },
      relations: ['vehicle', 'route', 'route.points', 'driver'],
    });
  }

  static async getByReference(reference: string, tenantId: string): Promise<TransferReservation | null> {
    return this.reservationRepo().findOne({
      where: { reference, tenantId },
      relations: ['vehicle', 'route', 'route.points', 'driver'],
    });
  }

  static async create(input: CreateTransferReservationInput): Promise<TransferReservation> {
    // Check if it's night rate (22:00 - 06:00)
    const [hours] = input.transferTime.split(':').map(Number);
    const isNightRate = hours >= 22 || hours < 6;

    // Calculate price
    const pricing = await TransferPricingService.calculatePrice({
      vehicleId: input.vehicleId,
      routeId: input.routeId,
      isRoundTrip: input.isRoundTrip ?? false,
      isNightRate,
      extraServices: input.extraServices,
    });

    const reference = await this.generateReference();

    const reservation = this.reservationRepo().create({
      ...input,
      reference,
      status: TransferReservationStatus.PENDING,
      luggageCount: input.luggageCount ?? 0,
      basePrice: pricing.basePrice,
      extraServicePrice: pricing.extraServicePrice,
      totalPrice: pricing.totalPrice,
      currencyCode: pricing.currencyCode,
      isRoundTrip: input.isRoundTrip ?? false,
      isNightRate,
      extraServices: input.extraServices,
      paymentStatus: 'pending',
      transferDate: new Date(input.transferDate),
      flightArrivalTime: input.flightArrivalTime ? new Date(input.flightArrivalTime) : undefined,
      flightDepartureTime: input.flightDepartureTime ? new Date(input.flightDepartureTime) : undefined,
    });

    return this.reservationRepo().save(reservation);
  }

  static async update(id: string, tenantId: string, input: UpdateTransferReservationInput): Promise<TransferReservation> {
    const reservation = await this.getById(id, tenantId);
    if (!reservation) {
      throw new Error('Transfer reservation not found');
    }

    // If route or vehicle changed, recalculate price
    if (input.routeId || input.vehicleId || input.isRoundTrip !== undefined || input.extraServices) {
      const routeId = input.routeId ?? reservation.routeId;
      const vehicleId = input.vehicleId ?? reservation.vehicleId;
      const isRoundTrip = input.isRoundTrip ?? reservation.isRoundTrip;
      const extraServices = input.extraServices ?? reservation.extraServices;

      const transferTime = input.transferTime ?? reservation.transferTime;
      const [hours] = transferTime.split(':').map(Number);
      const isNightRate = hours >= 22 || hours < 6;

      const pricing = await TransferPricingService.calculatePrice({
        vehicleId,
        routeId,
        isRoundTrip,
        isNightRate,
        extraServices,
      });

      Object.assign(reservation, {
        ...input,
        basePrice: pricing.basePrice,
        extraServicePrice: pricing.extraServicePrice,
        totalPrice: pricing.totalPrice,
        isNightRate,
      });
    } else {
      Object.assign(reservation, input);
    }

    // Handle date updates
    if (input.transferDate) {
      reservation.transferDate = new Date(input.transferDate);
    }
    if (input.flightArrivalTime) {
      reservation.flightArrivalTime = new Date(input.flightArrivalTime);
    }
    if (input.flightDepartureTime) {
      reservation.flightDepartureTime = new Date(input.flightDepartureTime);
    }

    return this.reservationRepo().save(reservation);
  }

  static async updateStatus(
    id: string,
    tenantId: string,
    status: TransferReservationStatus
  ): Promise<TransferReservation> {
    const reservation = await this.getById(id, tenantId);
    if (!reservation) {
      throw new Error('Transfer reservation not found');
    }

    reservation.status = status;
    return this.reservationRepo().save(reservation);
  }

  static async delete(id: string, tenantId: string): Promise<void> {
    const reservation = await this.getById(id, tenantId);
    if (!reservation) {
      throw new Error('Transfer reservation not found');
    }
    await this.reservationRepo().remove(reservation);
  }
}

