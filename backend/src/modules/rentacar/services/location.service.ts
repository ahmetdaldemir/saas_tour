import { Repository, In } from 'typeorm';
import { AppDataSource } from '../../../config/data-source';
import { Location, LocationType } from '../entities/location.entity';
import { getRedisClient } from '../../../config/redis.config';

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
};

export class LocationService {
  private static locationRepo(): Repository<Location> {
    return AppDataSource.getRepository(Location);
  }

  static async list(
    tenantId: string,
    parentId?: string | null,
    languageId?: string
  ): Promise<LocationDto[]> {
    try {
      // Redis cache key
      const cacheKey = `locations:tenant:${tenantId}:parent:${parentId ?? 'null'}:lang:${languageId ?? 'all'}`;
      const redis = getRedisClient();
      
      // Try to get from cache
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (cacheError) {
        // Redis error, continue with database query
        console.warn('Redis cache read error, falling back to database:', cacheError);
      }

      const whereCondition: any = { tenantId, isActive: true };
      
      // Check if we need to include children (when parentId is null or not provided, show top-level with children)
      const includeChildren = parentId === undefined || parentId === null || parentId === '' || parentId === 'null' || parentId === 'general';
      
      // Filter by parentId if provided and not requesting top-level
      if (!includeChildren) {
        whereCondition.parentId = parentId;
      } else {
        // Requesting top-level locations (parentId is null)
        whereCondition.parentId = null;
      }

      const locations = await this.locationRepo().find({
        where: whereCondition,
        relations: ['parent'],
        order: { sort: 'ASC', createdAt: 'DESC' },
      });

      let result: LocationDto[];

      // If we need to include children for top-level locations
      if (includeChildren && locations.length > 0) {
        const topLevelIds = locations.map(loc => loc.id);
        
        // Fetch all children of top-level locations
        const children = await this.locationRepo().find({
          where: {
            tenantId,
            parentId: In(topLevelIds),
            isActive: true,
          },
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
          childrenByParent.get(parentKey)!.push(this.mapLocationToDto(child, []));
        });

        // Map top-level locations with their children
        // parent field will be null since these are top-level locations
        result = locations.map(location => {
          const dto = this.mapLocationToDto(location, []);
          dto.children = childrenByParent.get(location.id) || [];
          // Top-level locations have no parent, so parent remains null
          return dto;
        });
      } else {
        // Note: Location entity doesn't have translations yet, but languageId parameter is prepared for future use
        result = locations.map(location => this.mapLocationToDto(location, []));
      }

      // Cache the result (TTL: 1 hour)
      try {
        await redis.setex(cacheKey, 3600, JSON.stringify(result));
      } catch (cacheError) {
        // Redis error, continue without caching
        console.warn('Redis cache write error:', cacheError);
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
    };
  }

  /**
   * Invalidate cache for a tenant's locations
   */
  private static async invalidateCache(tenantId: string): Promise<void> {
    try {
      const redis = getRedisClient();
      const pattern = `locations:tenant:${tenantId}:*`;
      
      // Get all matching keys
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      // Redis error, continue without cache invalidation
      console.warn('Redis cache invalidation error:', error);
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
      const redis = getRedisClient();
      
      // Try to get from cache
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (cacheError) {
        // Redis error, continue with database query
        console.warn('Redis cache read error, falling back to database:', cacheError);
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

      // Cache the result (TTL: 1 hour)
      try {
        await redis.setex(cacheKey, 3600, JSON.stringify(result));
      } catch (cacheError) {
        // Redis error, continue without caching
        console.warn('Redis cache write error:', cacheError);
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
