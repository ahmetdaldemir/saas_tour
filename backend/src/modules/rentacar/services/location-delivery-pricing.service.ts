import { Repository } from 'typeorm';
import { AppDataSource } from '../../../config/data-source';
import { LocationDeliveryPricing } from '../entities/location-delivery-pricing.entity';
import { Location } from '../entities/location.entity';

export type CreateLocationDeliveryPricingInput = {
  locationId: string;
  deliveryLocationId: string;
  distance: number;
  fee: number;
  isActive?: boolean;
};

export type BulkLocationDeliveryPricingInput = {
  locationId: string;
  pricings: Array<{
    deliveryLocationId: string;
    distance: number;
    fee: number;
    isActive?: boolean;
  }>;
};

export type LocationDeliveryPricingDto = {
  id: string;
  locationId: string;
  deliveryLocationId: string;
  deliveryLocationName?: string;
  distance: number;
  fee: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export class LocationDeliveryPricingService {
  private static pricingRepo(): Repository<LocationDeliveryPricing> {
    return AppDataSource.getRepository(LocationDeliveryPricing);
  }

  private static locationRepo(): Repository<Location> {
    return AppDataSource.getRepository(Location);
  }

  static async listByLocation(locationId: string): Promise<LocationDeliveryPricingDto[]> {
    const pricings = await this.pricingRepo().find({
      where: { locationId },
      relations: ['deliveryLocation', 'deliveryLocation.location'],
      order: { createdAt: 'ASC' },
    });

    return pricings.map((p) => {
      // Get master location name from deliveryLocation's location relation
      const deliveryLocationName = p.deliveryLocation.location?.name || '';
      return {
        id: p.id,
        locationId: p.locationId,
        deliveryLocationId: p.deliveryLocationId,
        deliveryLocationName,
        distance: Number(p.distance),
        fee: Number(p.fee),
        isActive: p.isActive,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      };
    });
  }

  static async upsert(input: CreateLocationDeliveryPricingInput): Promise<LocationDeliveryPricing> {
    const location = await this.locationRepo().findOne({ where: { id: input.locationId } });
    if (!location) {
      throw new Error('Location not found');
    }

    const deliveryLocation = await this.locationRepo().findOne({ where: { id: input.deliveryLocationId } });
    if (!deliveryLocation) {
      throw new Error('Delivery location not found');
    }

    let pricing = await this.pricingRepo().findOne({
      where: {
        locationId: input.locationId,
        deliveryLocationId: input.deliveryLocationId,
      },
    });

    if (!pricing) {
      pricing = this.pricingRepo().create({
        location,
        deliveryLocation,
        distance: input.distance,
        fee: input.fee,
        isActive: input.isActive !== undefined ? input.isActive : true,
      });
    } else {
      pricing.distance = input.distance;
      pricing.fee = input.fee;
      pricing.isActive = input.isActive !== undefined ? input.isActive : pricing.isActive;
    }

    return this.pricingRepo().save(pricing);
  }

  static async bulkUpsert(input: BulkLocationDeliveryPricingInput): Promise<LocationDeliveryPricing[]> {
    const location = await this.locationRepo().findOne({ where: { id: input.locationId } });
    if (!location) {
      throw new Error('Location not found');
    }

    const results: LocationDeliveryPricing[] = [];

    for (const pricingInput of input.pricings) {
      const deliveryLocation = await this.locationRepo().findOne({ where: { id: pricingInput.deliveryLocationId } });
      if (!deliveryLocation) {
        continue; // Skip if delivery location not found
      }

      let pricing = await this.pricingRepo().findOne({
        where: {
          locationId: input.locationId,
          deliveryLocationId: pricingInput.deliveryLocationId,
        },
      });

      if (!pricing) {
        pricing = this.pricingRepo().create({
          location,
          deliveryLocation,
          distance: pricingInput.distance,
          fee: pricingInput.fee,
          isActive: pricingInput.isActive !== undefined ? pricingInput.isActive : true,
        });
      } else {
        pricing.distance = pricingInput.distance;
        pricing.fee = pricingInput.fee;
        pricing.isActive = pricingInput.isActive !== undefined ? pricingInput.isActive : pricing.isActive;
      }

      const saved = await this.pricingRepo().save(pricing);
      results.push(saved);
    }

    return results;
  }

  static async remove(id: string): Promise<void> {
    const pricing = await this.pricingRepo().findOne({ where: { id } });
    if (!pricing) {
      throw new Error('Pricing not found');
    }
    await this.pricingRepo().remove(pricing);
  }
}

