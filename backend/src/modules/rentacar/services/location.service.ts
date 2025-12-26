import { Repository, In } from 'typeorm';
import { AppDataSource } from '../../../config/data-source';
import { Location } from '../entities/location.entity';
import { LocationDeliveryPricingService, LocationDeliveryPricingDto } from './location-delivery-pricing.service';
import { MasterLocationService, MasterLocationDto } from '../../shared/services/master-location.service';
import { getRedisClient, isRedisAvailable } from '../../../config/redis.config';
import { MasterLocationType } from '../../shared/entities/master-location.entity';

export type CreateLocationInput = {
  tenantId: string;
  locationId: string;
  metaTitle?: string;
  sort?: number;
  deliveryFee?: number;
  dropFee?: number;
  minDayCount?: number;
  isActive?: boolean;
};

export type UpdateLocationInput = Partial<CreateLocationInput>;

export type LocationDto = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  tenantId: string;
  locationId: string;
  location: MasterLocationDto;
  name: string; // From location
  type: MasterLocationType; // From location
  metaTitle?: string;
  sort: number;
  deliveryFee: number;
  dropFee: number;
  minDayCount?: number;
  isActive: boolean;
  children?: LocationDto[];
  drops?: LocationDeliveryPricingDto[];
};

export class LocationService {
  private static locationRepo(): Repository<Location> {
    return AppDataSource.getRepository(Location);
  }

  static async list(
    tenantId: string,
    parentLocationId?: string | null,
    isActive?: boolean
  ): Promise<LocationDto[]> {
    try {
      // Redis cache key
      const cacheKey = `locations:tenant:${tenantId}:parent:${parentLocationId ?? 'null'}:isActive:${isActive ?? 'all'}`;
      
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

      // Get master locations first (with parent-child structure)
      const includeChildren = parentLocationId === undefined || parentLocationId === null || parentLocationId === '' || parentLocationId === 'null';
      
      const masterLocations = await MasterLocationService.list(
        includeChildren ? null : parentLocationId
      );

      if (masterLocations.length === 0) {
        return [];
      }

      // Get all tenant locations for this tenant
      const tenantLocationWhere: any = { tenantId };
      if (isActive !== undefined) {
        tenantLocationWhere.isActive = isActive;
      }
      
      const tenantLocations = await this.locationRepo().find({
        where: tenantLocationWhere,
        relations: ['location'],
      });

      // Create a map of tenant locations by locationId
      const tenantLocationMap = new Map<string, Location>();
      tenantLocations.forEach(loc => {
        tenantLocationMap.set(loc.locationId, loc);
      });

      // Build result by combining master locations with tenant-specific data
      const result: LocationDto[] = [];
      
      for (const masterLoc of masterLocations) {
        const tenantLoc = tenantLocationMap.get(masterLoc.id);
        
        // Only include locations that are mapped in tenant (if filtering by isActive, only include active ones)
        if (!tenantLoc && isActive !== undefined && !isActive) {
          // If we want inactive locations and this master location is not mapped, skip it
          continue;
        }
        
        // If master location is not mapped but we want all locations (isActive === undefined), we can create a default entry
        // But typically we only show mapped locations to tenant
        if (!tenantLoc) {
          continue;
        }

        const locationDto: LocationDto = {
          id: tenantLoc.id,
          createdAt: tenantLoc.createdAt,
          updatedAt: tenantLoc.updatedAt,
          tenantId: tenantLoc.tenantId,
          locationId: tenantLoc.locationId,
          location: masterLoc,
          name: masterLoc.name,
          type: masterLoc.type,
          metaTitle: tenantLoc.metaTitle,
          sort: tenantLoc.sort,
          deliveryFee: tenantLoc.deliveryFee,
          dropFee: tenantLoc.dropFee,
          minDayCount: tenantLoc.minDayCount,
          isActive: tenantLoc.isActive,
          children: [],
        };

        // Fetch delivery pricing (drops)
        try {
          locationDto.drops = await LocationDeliveryPricingService.listByLocation(tenantLoc.id);
        } catch (error) {
          console.error(`Failed to fetch delivery pricing for location ${tenantLoc.id}:`, error);
          locationDto.drops = [];
        }

        // Handle children if master location has children
        if (masterLoc.children && masterLoc.children.length > 0) {
          const childMasterLocationIds = masterLoc.children.map(c => c.id);
          const childTenantLocations = tenantLocations.filter(loc => 
            childMasterLocationIds.includes(loc.locationId)
          );

          const childDtos: LocationDto[] = [];
          for (const childMasterLoc of masterLoc.children) {
            const childTenantLoc = childTenantLocations.find(loc => loc.locationId === childMasterLoc.id);
            
            if (!childTenantLoc) {
              continue;
            }

            const childDto: LocationDto = {
              id: childTenantLoc.id,
              createdAt: childTenantLoc.createdAt,
              updatedAt: childTenantLoc.updatedAt,
              tenantId: childTenantLoc.tenantId,
              locationId: childTenantLoc.locationId,
              location: childMasterLoc,
              name: childMasterLoc.name,
              type: childMasterLoc.type,
              metaTitle: childTenantLoc.metaTitle,
              sort: childTenantLoc.sort,
              deliveryFee: childTenantLoc.deliveryFee,
              dropFee: childTenantLoc.dropFee,
              minDayCount: childTenantLoc.minDayCount,
              isActive: childTenantLoc.isActive,
              children: [],
            };

            try {
              childDto.drops = await LocationDeliveryPricingService.listByLocation(childTenantLoc.id);
            } catch (error) {
              console.error(`Failed to fetch delivery pricing for child location ${childTenantLoc.id}:`, error);
              childDto.drops = [];
            }

            childDtos.push(childDto);
          }
          
          locationDto.children = childDtos;
        }

        result.push(locationDto);
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
      locationId,
      metaTitle,
      sort,
      deliveryFee,
      dropFee,
      minDayCount,
      isActive,
    } = input;

    // Check if master location exists
    const masterLocation = await MasterLocationService.getById(locationId);
    if (!masterLocation) {
      throw new Error('Master location not found');
    }

    // Check if location already exists for this tenant
    const existingLocation = await this.locationRepo().findOne({
      where: { tenantId, locationId },
    });

    if (existingLocation) {
      throw new Error('Location already exists for this tenant');
    }

    // Build parent chain (from root to the selected location)
    // Start from the selected location's parent and go up to root
    const parentChain: string[] = [];
    let currentMasterLoc = masterLocation;
    
    // Traverse up the parent chain to collect all parent IDs
    while (currentMasterLoc.parentId) {
      parentChain.push(currentMasterLoc.parentId);
      const parentMasterLoc = await MasterLocationService.getById(currentMasterLoc.parentId);
      if (!parentMasterLoc) {
        break;
      }
      currentMasterLoc = parentMasterLoc;
    }
    
    // Reverse to get root-to-leaf order (root first, then children)
    parentChain.reverse();

    // Now create locations for all parent chain + the selected location
    // Process from root to leaf (parentChain is already in correct order)
    const locationsToCreate: Array<{ locationId: string; isSelected: boolean }> = [
      ...parentChain.map(id => ({ locationId: id, isSelected: false })),
      { locationId, isSelected: true }, // Selected location is last
    ];

    let savedLocation: Location | null = null;

    // Create all parent locations first, then the selected one
    for (const locData of locationsToCreate) {
      // Check if this location already exists for tenant
      const existing = await this.locationRepo().findOne({
        where: { tenantId, locationId: locData.locationId },
      });

      if (existing) {
        // If it's the selected location and already exists, we already checked above
        if (locData.isSelected) {
          savedLocation = existing;
        }
        continue; // Skip if parent already exists
      }

      // Create location entry
      const location = this.locationRepo().create({
        tenantId,
        locationId: locData.locationId,
        metaTitle: locData.isSelected ? metaTitle?.trim() : undefined,
        sort: locData.isSelected ? (sort ?? 0) : 0,
        deliveryFee: locData.isSelected ? (deliveryFee || 0) : 0,
        dropFee: locData.isSelected ? (dropFee || 0) : 0,
        minDayCount: locData.isSelected ? minDayCount : undefined,
        isActive: locData.isSelected 
          ? (isActive !== undefined ? isActive : true)
          : true, // Parents are active by default
      });

      const saved = await this.locationRepo().save(location);
      
      if (locData.isSelected) {
        savedLocation = saved;
      }
    }

    if (!savedLocation) {
      throw new Error('Failed to create location');
    }

    // Reload with location relation
    const reloadedLocation = await this.locationRepo().findOne({
      where: { id: savedLocation.id },
      relations: ['location'],
    });

    if (!reloadedLocation) {
      throw new Error('Failed to reload location');
    }

    // Invalidate cache
    await this.invalidateCache(tenantId);

    return this.mapToDto(reloadedLocation, masterLocation);
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
        relations: ['location'],
      });

      if (!location) {
        return null;
      }

      const masterLocation = await MasterLocationService.getById(location.locationId);
      if (!masterLocation) {
        throw new Error('Master location not found');
      }

      const result = this.mapToDto(location, masterLocation);

      // Fetch delivery pricing (drops)
      try {
        result.drops = await LocationDeliveryPricingService.listByLocation(location.id);
      } catch (error) {
        console.error(`Failed to fetch delivery pricing for location ${location.id}:`, error);
        result.drops = [];
      }

      // Fetch children if master location has children
      if (masterLocation.children && masterLocation.children.length > 0) {
        const childMasterLocationIds = masterLocation.children.map(c => c.id);
        const childTenantLocations = await this.locationRepo().find({
          where: {
            tenantId: location.tenantId,
            locationId: In(childMasterLocationIds),
            isActive: true,
          },
          relations: ['location'],
        });

        const childDtos: LocationDto[] = [];
        for (const childMasterLoc of masterLocation.children) {
          const childTenantLoc = childTenantLocations.find(loc => loc.locationId === childMasterLoc.id);
          
          if (!childTenantLoc) {
            continue;
          }

          const childDto = this.mapToDto(childTenantLoc, childMasterLoc);

          try {
            childDto.drops = await LocationDeliveryPricingService.listByLocation(childTenantLoc.id);
          } catch (error) {
            console.error(`Failed to fetch delivery pricing for child location ${childTenantLoc.id}:`, error);
            childDto.drops = [];
          }

          childDtos.push(childDto);
        }
        
        result.children = childDtos;
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

  private static mapToDto(location: Location, masterLocation: MasterLocationDto): LocationDto {
    return {
      id: location.id,
      createdAt: location.createdAt,
      updatedAt: location.updatedAt,
      tenantId: location.tenantId,
      locationId: location.locationId,
      location: masterLocation,
      name: masterLocation.name,
      type: masterLocation.type,
      metaTitle: location.metaTitle,
      sort: location.sort,
      deliveryFee: location.deliveryFee,
      dropFee: location.dropFee,
      minDayCount: location.minDayCount,
      isActive: location.isActive,
      children: [],
      drops: undefined,
    };
  }

  static async update(id: string, input: UpdateLocationInput): Promise<LocationDto> {
    const location = await this.locationRepo().findOne({ 
      where: { id },
      relations: ['location'],
    });
    
    if (!location) {
      throw new Error('Location not found');
    }

    // Handle locationId change (re-mapping to different master location)
    if (input.locationId !== undefined && input.locationId !== location.locationId) {
      const masterLocation = await MasterLocationService.getById(input.locationId);
      if (!masterLocation) {
        throw new Error('Master location not found');
      }

      // Check if this tenant already has a location mapped to this master location
      const existingLocation = await this.locationRepo().findOne({
        where: { tenantId: location.tenantId, locationId: input.locationId },
      });

      if (existingLocation && existingLocation.id !== id) {
        throw new Error('Location already exists for this master location and tenant');
      }

      location.locationId = input.locationId;
    }

    if (input.metaTitle !== undefined) location.metaTitle = input.metaTitle?.trim();
    if (input.sort !== undefined) location.sort = input.sort;
    if (input.deliveryFee !== undefined) location.deliveryFee = input.deliveryFee;
    if (input.dropFee !== undefined) location.dropFee = input.dropFee;
    if (input.minDayCount !== undefined) location.minDayCount = input.minDayCount;
    if (input.isActive !== undefined) location.isActive = input.isActive;

    const savedLocation = await this.locationRepo().save(location);

    // Reload with location relation
    const reloadedLocation = await this.locationRepo().findOne({
      where: { id: savedLocation.id },
      relations: ['location'],
    });

    if (!reloadedLocation) {
      throw new Error('Failed to reload location');
    }

    const masterLocation = await MasterLocationService.getById(reloadedLocation.locationId);
    if (!masterLocation) {
      throw new Error('Master location not found');
    }

    // Invalidate cache
    await this.invalidateCache(location.tenantId);

    return this.mapToDto(reloadedLocation, masterLocation);
  }

  static async remove(id: string): Promise<void> {
    const location = await this.locationRepo().findOne({ where: { id } });
    if (!location) {
      throw new Error('Location not found');
    }

    // Soft delete: set isActive to false instead of removing
    location.isActive = false;
    await this.locationRepo().save(location);

    // Invalidate cache
    await this.invalidateCache(location.tenantId);
  }
}
