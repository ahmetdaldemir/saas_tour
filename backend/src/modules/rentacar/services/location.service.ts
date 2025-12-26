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

      // Get all tenant locations for this tenant first
      const tenantLocationWhere: any = { tenantId };
      if (isActive !== undefined) {
        tenantLocationWhere.isActive = isActive;
      }
      
      const tenantLocations = await this.locationRepo().find({
        where: tenantLocationWhere,
        relations: ['location'],
      });

      if (tenantLocations.length === 0) {
        return [];
      }

      // Create a map of tenant locations by locationId
      const tenantLocationMap = new Map<string, Location>();
      tenantLocations.forEach(loc => {
        tenantLocationMap.set(loc.locationId, loc);
      });

      // Get all master locations that tenant has mapped (including parents and children)
      // Since LocationService.create automatically adds parent chain, all needed locations should be in tenantLocations
      const mappedLocationIds = Array.from(tenantLocationMap.keys());
      
      // Get all master locations (with full hierarchy)
      const allMasterLocations = await MasterLocationService.list(null);
      
      // Helper function to find master location by ID in the hierarchy
      const findMasterLocationById = (locations: MasterLocationDto[], id: string): MasterLocationDto | null => {
        for (const loc of locations) {
          if (loc.id === id) return loc;
          if (loc.children) {
            const found = findMasterLocationById(loc.children, id);
            if (found) return found;
          }
        }
        return null;
      };

      // Build a set of all master location IDs we need (mapped locations + their parents for hierarchy)
      const neededMasterLocationIds = new Set<string>(mappedLocationIds);
      
      // For each mapped location, add its parents to the needed set
      mappedLocationIds.forEach(locationId => {
        const masterLoc = findMasterLocationById(allMasterLocations, locationId);
        if (masterLoc) {
          // Add all parents
          let current = masterLoc;
          while (current.parentId) {
            neededMasterLocationIds.add(current.parentId);
            const parent = findMasterLocationById(allMasterLocations, current.parentId);
            if (parent) {
              current = parent;
            } else {
              break;
            }
          }
        }
      });

      // Filter master locations to only include needed ones and their children
      const filterAndIncludeChildren = (locations: MasterLocationDto[]): MasterLocationDto[] => {
        const result: MasterLocationDto[] = [];
        
        locations.forEach(loc => {
          // Include if it's in the needed set
          if (neededMasterLocationIds.has(loc.id)) {
            const filteredLoc = {
              ...loc,
              children: loc.children ? filterAndIncludeChildren(loc.children) : [],
            };
            result.push(filteredLoc);
          } else if (loc.children) {
            // Check children recursively
            const filteredChildren = filterAndIncludeChildren(loc.children);
            if (filteredChildren.length > 0) {
              // If any child is needed, include this parent too for hierarchy
              neededMasterLocationIds.add(loc.id);
              result.push({
                ...loc,
                children: filteredChildren,
              });
            }
          }
        });
        
        return result;
      };

      const masterLocations = filterAndIncludeChildren(allMasterLocations);

      if (masterLocations.length === 0) {
        return [];
      }

      // Build result by combining master locations with tenant-specific data
      const result: LocationDto[] = [];
      
      for (const masterLoc of masterLocations) {
        const tenantLoc = tenantLocationMap.get(masterLoc.id);
        
        // Only show locations that are in rentacar_locations table
        // Parent locations are automatically added by LocationService.create, so they should be in tenantLocationMap
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

    // Build parent chain (from root to the selected location) - going UP
    const parentChain: string[] = [];
    let currentMasterLoc = masterLocation;
    
    console.log(`[LocationService.create] Building parent chain for location: ${masterLocation.name} (id: ${locationId})`);
    console.log(`[LocationService.create] Initial parentId: ${masterLocation.parentId}`);
    
    // Traverse up the parent chain to collect all parent IDs
    while (currentMasterLoc.parentId) {
      console.log(`[LocationService.create] Found parent: ${currentMasterLoc.parentId}`);
      parentChain.push(currentMasterLoc.parentId);
      const parentMasterLoc = await MasterLocationService.getById(currentMasterLoc.parentId);
      if (!parentMasterLoc) {
        console.log(`[LocationService.create] Parent location not found: ${currentMasterLoc.parentId}`);
        break;
      }
      console.log(`[LocationService.create] Parent location found: ${parentMasterLoc.name} (parentId: ${parentMasterLoc.parentId})`);
      currentMasterLoc = parentMasterLoc;
    }
    
    // Reverse to get root-to-leaf order (root first, then children)
    parentChain.reverse();
    
    console.log(`[LocationService.create] Parent chain (${parentChain.length} parents):`, parentChain);

    // Build children chain (all children of the selected location) - going DOWN
    const childrenChain: string[] = [];
    
    // Recursive function to collect all children IDs (including grandchildren, etc.)
    const collectChildren = async (parentId: string) => {
      // Get direct children
      const directChildren = await MasterLocationService.list(parentId);
      for (const child of directChildren) {
        childrenChain.push(child.id);
        console.log(`[LocationService.create] Found child: ${child.name} (id: ${child.id})`);
        // Recursively collect grandchildren and deeper descendants
        await collectChildren(child.id);
      }
    };
    
    // If selected location is a top-level (parentId is null), collect all its children
    if (!masterLocation.parentId) {
      console.log(`[LocationService.create] Selected location is top-level, collecting all children recursively...`);
      await collectChildren(locationId);
      console.log(`[LocationService.create] Children chain (${childrenChain.length} total children):`, childrenChain);
    }

    // Now create locations for: parent chain + selected location + children chain
    const locationsToCreate: Array<{ locationId: string; isSelected: boolean }> = [
      ...parentChain.map(id => ({ locationId: id, isSelected: false })),
      { locationId, isSelected: true }, // Selected location
      ...childrenChain.map(id => ({ locationId: id, isSelected: false })), // All children
    ];

    console.log(`[LocationService.create] Locations to create (${locationsToCreate.length} total):`, locationsToCreate.map(l => ({ id: l.locationId, isSelected: l.isSelected })));

    let savedLocation: Location | null = null;

    // Create all locations: parents first, then selected, then children
    for (const locData of locationsToCreate) {
      // Check if this location already exists for tenant
      const existing = await this.locationRepo().findOne({
        where: { tenantId, locationId: locData.locationId },
      });

      if (existing) {
        console.log(`[LocationService.create] Location ${locData.locationId} already exists for tenant, skipping`);
        // If it's the selected location and already exists, we already checked above
        if (locData.isSelected) {
          savedLocation = existing;
        }
        continue; // Skip if already exists
      }

      console.log(`[LocationService.create] Creating location entry: ${locData.locationId} (isSelected: ${locData.isSelected})`);

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
          : true, // Parents and children are active by default
      });

      const saved = await this.locationRepo().save(location);
      console.log(`[LocationService.create] ✅ Created location entry: ${saved.id} for master location: ${locData.locationId}`);
      
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

    // Soft delete: Use TypeORM soft remove
    await this.locationRepo().softRemove(location);

    // Invalidate cache
    await this.invalidateCache(location.tenantId);
  }
}
