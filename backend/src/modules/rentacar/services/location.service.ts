import { Repository, In, IsNull } from 'typeorm';
import { AppDataSource } from '../../../config/data-source';
import { Location, LocationType } from '../entities/location.entity';
import { LocationDeliveryPricingService, LocationDeliveryPricingDto } from './location-delivery-pricing.service';
import { getRedisClient, isRedisAvailable } from '../../../config/redis.config';

export type CreateLocationInput = {
  tenantId: string;
  name: string;
  metaTitle?: string;
  parentId?: string | null;
  type?: LocationType;
  sort?: number;
  deliveryFee?: number;
  dropFee?: number;
  minDayCount?: number;
  isActive?: boolean;
};

export type UpdateLocationInput = Partial<CreateLocationInput>;

export type LocationDto = Omit<Location, 'tenant' | 'parent' | 'children'> & {
  parent?: LocationDto | null;
  children?: LocationDto[];
  drops?: LocationDeliveryPricingDto[]; // Delivery pricing data for this location
};

export class LocationService {
  private static locationRepo(): Repository<Location> {
    return AppDataSource.getRepository(Location);
  }

  static async list(
    tenantId: string,
    parentId?: string | null,
    languageId?: string,
    isActive?: boolean
  ): Promise<LocationDto[]> {
    try {
      // Redis cache key
      const cacheKey = `locations:tenant:${tenantId}:parent:${parentId ?? 'null'}:lang:${languageId ?? 'all'}:isActive:${isActive ?? 'all'}`;
      
      // Try to get from cache (only if Redis is available)
      if (isRedisAvailable()) {
        try {
          const redis = getRedisClient();
          const cached = await redis.get(cacheKey);
          if (cached) {
            return JSON.parse(cached);
          }
        } catch (cacheError) {
          // Redis error, continue with database query (silent fail)
        }
      }

      // Check if we need to include children (when parentId is null or not provided, show top-level with children)
      const includeChildren = parentId === undefined || parentId === null || parentId === '' || parentId === 'null' || parentId === 'general';
      
      // Build where condition for isActive filter
      const whereCondition: any = { tenantId };
      if (isActive !== undefined) {
        whereCondition.isActive = isActive;
      }
      
      let result: LocationDto[];

      if (includeChildren) {
        // Requesting top-level locations (parentId is null) with their children
        // Step 1: Get ONLY top-level locations (parentId IS NULL) for this tenant
        const topLevelWhere: any = {
          ...whereCondition,
          parentId: IsNull(), // Explicitly null - only top-level locations
        };
        
        const topLevelLocations = await this.locationRepo().find({
          where: topLevelWhere,
          relations: ['parent'],
          order: { sort: 'ASC', createdAt: 'DESC' },
        });

        if (topLevelLocations.length === 0) {
          return [];
        }

        // Step 2: Get children of these top-level locations ONLY
        // If isActive parameter is provided, filter children by isActive status
        // If isActive is not provided, return all children (active + inactive)
        const topLevelIds = topLevelLocations.map(loc => loc.id);
        const childrenWhere: any = {
          tenantId,
          parentId: In(topLevelIds), // Only direct children of top-level locations
        };
        
        // Apply isActive filter to children if parameter is provided
        if (isActive !== undefined) {
          childrenWhere.isActive = isActive;
        }
        
        const children = await this.locationRepo().find({
          where: childrenWhere,
          relations: ['parent'],
          order: { sort: 'ASC', createdAt: 'DESC' },
        });

        // Group children by parentId
        const childrenByParent = new Map<string, LocationDto[]>();
        children.forEach(child => {
          const parentKey = child.parentId || '';
          if (!childrenByParent.has(parentKey)) {
            childrenByParent.set(parentKey, []);
          }
          // Children should not have their own children in this response
          childrenByParent.get(parentKey)!.push(this.mapLocationToDto(child, []));
        });

        // Map top-level locations with their direct children only
        // If isActive parameter was provided, children are already filtered by isActive status
        result = await Promise.all(
          topLevelLocations.map(async (location) => {
            const dto = this.mapLocationToDto(location, []);
            // Get children for this parent (already filtered by isActive if parameter was provided)
            dto.children = childrenByParent.get(location.id) || [];
            dto.parent = null; // Top-level locations have no parent
            
            // Fetch delivery pricing (drops) for this location
            try {
              dto.drops = await LocationDeliveryPricingService.listByLocation(location.id);
            } catch (error) {
              console.error(`Failed to fetch delivery pricing for location ${location.id}:`, error);
              dto.drops = [];
            }
            
            return dto;
          })
        );
        
        // Also add drops to children
        for (const locationDto of result) {
          if (locationDto.children && locationDto.children.length > 0) {
            locationDto.children = await Promise.all(
              locationDto.children.map(async (child) => {
                try {
                  child.drops = await LocationDeliveryPricingService.listByLocation(child.id);
                } catch (error) {
                  console.error(`Failed to fetch delivery pricing for child location ${child.id}:`, error);
                  child.drops = [];
                }
                return child;
              })
            );
          }
        }
      } else {
        // Filter by specific parentId
        const parentWhere: any = {
          tenantId,
          parentId: parentId,
        };
        if (isActive !== undefined) {
          parentWhere.isActive = isActive;
        }
        
        const locations = await this.locationRepo().find({
          where: parentWhere,
          relations: ['parent'],
          order: { sort: 'ASC', createdAt: 'DESC' },
        });

        // Map locations and add delivery pricing (drops) for each
        result = await Promise.all(
          locations.map(async (location) => {
            const dto = this.mapLocationToDto(location, []);
            
            // Fetch delivery pricing (drops) for this location
            try {
              dto.drops = await LocationDeliveryPricingService.listByLocation(location.id);
            } catch (error) {
              console.error(`Failed to fetch delivery pricing for location ${location.id}:`, error);
              dto.drops = [];
            }
            
            return dto;
          })
        );
      }

      // Cache the result (TTL: 1 hour) - only if Redis is available
      if (isRedisAvailable()) {
        try {
          const redis = getRedisClient();
          await redis.setex(cacheKey, 3600, JSON.stringify(result));
        } catch (cacheError) {
          // Redis error, continue without caching (silent fail)
        }
      }

      return result;
    } catch (error) {
      console.error('Error in LocationService.list:', error);
      throw error;
    }
  }

  private static mapLocationToDto(location: Location, children: LocationDto[] = []): LocationDto {
    return {
      id: location.id,
      createdAt: location.createdAt,
      updatedAt: location.updatedAt,
      tenantId: location.tenantId,
      name: location.name,
      metaTitle: location.metaTitle,
      parentId: location.parentId,
      parent: location.parent ? {
        id: location.parent.id,
        createdAt: location.parent.createdAt,
        updatedAt: location.parent.updatedAt,
        tenantId: location.parent.tenantId,
        name: location.parent.name,
        metaTitle: location.parent.metaTitle,
        parentId: location.parent.parentId,
        type: location.parent.type,
        sort: location.parent.sort,
        deliveryFee: location.parent.deliveryFee,
        dropFee: location.parent.dropFee,
        minDayCount: location.parent.minDayCount,
        isActive: location.parent.isActive,
      } : null,
      type: location.type,
      sort: location.sort,
      deliveryFee: location.deliveryFee,
      dropFee: location.dropFee,
      minDayCount: location.minDayCount,
      isActive: location.isActive,
      children: children,
      drops: undefined, // Will be populated by the calling method
    };
  }

  /**
   * Invalidate cache for a tenant's locations
   */
  private static async invalidateCache(tenantId: string): Promise<void> {
    if (!isRedisAvailable()) {
      return;
    }
    
    try {
      const redis = getRedisClient();
      const pattern = `locations:tenant:${tenantId}:*`;
      
      // Get all matching keys
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      // Redis error, continue without cache invalidation (silent fail)
    }
  }

  static async create(input: CreateLocationInput): Promise<LocationDto> {
    const {
      tenantId,
      name,
      metaTitle,
      parentId,
      type,
      sort,
      deliveryFee,
      dropFee,
      minDayCount,
      isActive,
    } = input;

    if (!name || name.trim().length === 0) {
      throw new Error('Location name is required');
    }

    let parent: Location | null = null;
    if (parentId) {
      parent = await this.locationRepo().findOne({ where: { id: parentId } });
      if (!parent) {
        throw new Error('Parent location not found');
      }
    }

    const location = this.locationRepo().create({
      tenantId,
      name: name.trim(),
      metaTitle: metaTitle?.trim(),
      parent: parent,
      parentId: parentId || null,
      type: type || LocationType.MERKEZ,
      sort: sort ?? 0,
      deliveryFee: deliveryFee || 0,
      dropFee: dropFee || 0,
      minDayCount,
      isActive: isActive !== undefined ? isActive : true,
    });

    const savedLocation = await this.locationRepo().save(location);

    // Invalidate cache
    await this.invalidateCache(tenantId);

    return this.mapLocationToDto(savedLocation, []);
  }

  static async getById(id: string): Promise<LocationDto | null> {
    try {
      // Redis cache key
      const cacheKey = `location:id:${id}`;
      
      // Try to get from cache (only if Redis is available)
      if (isRedisAvailable()) {
        try {
          const redis = getRedisClient();
          const cached = await redis.get(cacheKey);
          if (cached) {
            return JSON.parse(cached);
          }
        } catch (cacheError) {
          // Redis error, continue with database query (silent fail)
        }
      }

      const location = await this.locationRepo().findOne({
        where: { id, isActive: true },
        relations: ['parent'],
      });

      if (!location) {
        return null;
      }

      // Get children if any
      const children = await this.locationRepo().find({
        where: { parentId: id, isActive: true },
        relations: ['parent'],
        order: { sort: 'ASC', createdAt: 'DESC' },
      });

      const result = this.mapLocationToDto(
        location,
        children.map(child => this.mapLocationToDto(child, []))
      );

      // Fetch delivery pricing (drops) for the main location
      try {
        result.drops = await LocationDeliveryPricingService.listByLocation(location.id);
      } catch (error) {
        console.error(`Failed to fetch delivery pricing for location ${location.id}:`, error);
        result.drops = [];
      }

      // Fetch delivery pricing (drops) for children
      if (result.children && result.children.length > 0) {
        result.children = await Promise.all(
          result.children.map(async (child) => {
            try {
              child.drops = await LocationDeliveryPricingService.listByLocation(child.id);
            } catch (error) {
              console.error(`Failed to fetch delivery pricing for child location ${child.id}:`, error);
              child.drops = [];
            }
            return child;
          })
        );
      }

      // Cache the result (TTL: 1 hour) - only if Redis is available
      if (isRedisAvailable()) {
        try {
          const redis = getRedisClient();
          await redis.setex(cacheKey, 3600, JSON.stringify(result));
        } catch (cacheError) {
          // Redis error, continue without caching (silent fail)
        }
      }

      return result;
    } catch (error) {
      console.error('Error in LocationService.getById:', error);
      throw error;
    }
  }

  static async update(id: string, input: UpdateLocationInput): Promise<LocationDto> {
    const location = await this.locationRepo().findOne({ where: { id } });
    if (!location) {
      throw new Error('Location not found');
    }

    if (input.name !== undefined) location.name = input.name.trim();
    if (input.metaTitle !== undefined) location.metaTitle = input.metaTitle?.trim();
    if (input.type !== undefined) location.type = input.type;
    if (input.sort !== undefined) location.sort = input.sort;
    if (input.deliveryFee !== undefined) location.deliveryFee = input.deliveryFee;
    if (input.dropFee !== undefined) location.dropFee = input.dropFee;
    if (input.minDayCount !== undefined) location.minDayCount = input.minDayCount;
    if (input.isActive !== undefined) location.isActive = input.isActive;

    // Handle parent relationship
    if (input.parentId !== undefined) {
      if (input.parentId === null) {
        location.parent = null;
        location.parentId = null;
      } else {
        // Prevent self-reference
        if (input.parentId === id) {
          throw new Error('Location cannot be its own parent');
        }
        const parent = await this.locationRepo().findOne({ where: { id: input.parentId } });
        if (!parent) {
          throw new Error('Parent location not found');
        }
        location.parent = parent;
        location.parentId = input.parentId;
      }
    }

    const savedLocation = await this.locationRepo().save(location);

    // Reload with parent relation
    const reloadedLocation = await this.locationRepo().findOne({
      where: { id: savedLocation.id },
      relations: ['parent'],
    });

    if (!reloadedLocation) {
      throw new Error('Failed to reload location');
    }

    // Invalidate cache
    await this.invalidateCache(location.tenantId);

    return this.mapLocationToDto(reloadedLocation, []);
  }

  static async remove(id: string): Promise<void> {
    const location = await this.locationRepo().findOne({ where: { id } });
    if (!location) {
      throw new Error('Location not found');
    }

    // Check if location has active children
    const children = await this.locationRepo().find({
      where: { parentId: id, isActive: true },
    });

    if (children.length > 0) {
      throw new Error(
        `Bu lokasyon silinemez çünkü ${children.length} adet aktif alt lokasyona sahip. Lütfen önce alt lokasyonları silin veya pasif hale getirin.`
      );
    }

    // Soft delete: set isActive to false instead of removing
    location.isActive = false;
    await this.locationRepo().save(location);

    // Invalidate cache
    await this.invalidateCache(location.tenantId);
  }
}
