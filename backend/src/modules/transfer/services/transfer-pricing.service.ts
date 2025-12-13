import { Repository } from 'typeorm';
import { AppDataSource } from '../../../config/data-source';
import { TransferPricing, PricingModel } from '../entities/transfer-pricing.entity';

export type CreateTransferPricingInput = {
  tenantId: string;
  vehicleId: string;
  routeId: string;
  pricingModel: PricingModel;
  basePrice: number;
  currencyCode?: string;
  isRoundTrip?: boolean;
  isNightRate?: boolean;
  nightRateSurcharge?: number;
  extraServicePrices?: Record<string, number>;
  minPassengers?: number;
  maxPassengers?: number;
  isActive?: boolean;
  notes?: string;
};

export type UpdateTransferPricingInput = Partial<Omit<CreateTransferPricingInput, 'tenantId'>>;

export class TransferPricingService {
  private static pricingRepo(): Repository<TransferPricing> {
    return AppDataSource.getRepository(TransferPricing);
  }

  static async list(tenantId: string, filters?: { vehicleId?: string; routeId?: string }): Promise<TransferPricing[]> {
    const where: any = { tenantId };
    if (filters?.vehicleId) {
      where.vehicleId = filters.vehicleId;
    }
    if (filters?.routeId) {
      where.routeId = filters.routeId;
    }

    return this.pricingRepo().find({
      where,
      relations: ['vehicle', 'route'],
      order: { createdAt: 'DESC' },
    });
  }

  static async getById(id: string, tenantId: string): Promise<TransferPricing | null> {
    return this.pricingRepo().findOne({
      where: { id, tenantId },
      relations: ['vehicle', 'route'],
    });
  }

  static async create(input: CreateTransferPricingInput): Promise<TransferPricing> {
    const pricing = this.pricingRepo().create({
      ...input,
      currencyCode: input.currencyCode ?? 'EUR',
      isRoundTrip: input.isRoundTrip ?? false,
      isNightRate: input.isNightRate ?? false,
      isActive: input.isActive ?? true,
    });
    return this.pricingRepo().save(pricing);
  }

  static async update(id: string, tenantId: string, input: UpdateTransferPricingInput): Promise<TransferPricing> {
    const pricing = await this.getById(id, tenantId);
    if (!pricing) {
      throw new Error('Transfer pricing not found');
    }

    Object.assign(pricing, input);
    return this.pricingRepo().save(pricing);
  }

  static async delete(id: string, tenantId: string): Promise<void> {
    const pricing = await this.pricingRepo().findOne({ where: { id } });
    if (!pricing) {
      throw new Error('Transfer pricing not found');
    }
    await this.pricingRepo().remove(pricing);
  }

  /**
   * Calculate price for a transfer reservation
   */
  static async calculatePrice(params: {
    vehicleId: string;
    routeId: string;
    isRoundTrip: boolean;
    isNightRate: boolean;
    extraServices?: Record<string, any>;
  }): Promise<{ basePrice: number; extraServicePrice: number; totalPrice: number; currencyCode: string }> {
    const pricing = await this.pricingRepo().findOne({
      where: {
        vehicleId: params.vehicleId,
        routeId: params.routeId,
        isRoundTrip: params.isRoundTrip,
        isNightRate: params.isNightRate,
        isActive: true,
      },
      relations: ['vehicle', 'route'],
    });

    if (!pricing) {
      throw new Error('Pricing not found for the given criteria');
    }

    let basePrice = Number(pricing.basePrice);

    // Apply night rate surcharge if applicable
    if (params.isNightRate && pricing.nightRateSurcharge) {
      basePrice += Number(pricing.nightRateSurcharge);
    }

    // Calculate extra service prices
    let extraServicePrice = 0;
    if (params.extraServices && pricing.extraServicePrices) {
      Object.keys(params.extraServices).forEach((key) => {
        if (params.extraServices![key] && pricing.extraServicePrices![key]) {
          extraServicePrice += Number(pricing.extraServicePrices![key]);
        }
      });
    }

    return {
      basePrice: Number(pricing.basePrice),
      extraServicePrice,
      totalPrice: basePrice + extraServicePrice,
      currencyCode: pricing.currencyCode,
    };
  }
}

