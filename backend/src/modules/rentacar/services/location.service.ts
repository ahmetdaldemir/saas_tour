import { Repository } from 'typeorm';
import { AppDataSource } from '../../../config/data-source';
import { Location, LocationType } from '../entities/location.entity';

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
};

export class LocationService {
  private static locationRepo(): Repository<Location> {
    return AppDataSource.getRepository(Location);
  }

  static async list(tenantId: string): Promise<LocationDto[]> {
    const locations = await this.locationRepo().find({
      where: { tenantId },
      relations: ['parent'],
      order: { sort: 'ASC', createdAt: 'DESC' },
    });

    return locations.map((location) => ({
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
    }));
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

    return {
      id: savedLocation.id,
      createdAt: savedLocation.createdAt,
      updatedAt: savedLocation.updatedAt,
      tenantId: savedLocation.tenantId,
      name: savedLocation.name,
      metaTitle: savedLocation.metaTitle,
      parentId: savedLocation.parentId,
      parent: savedLocation.parent ? {
        id: savedLocation.parent.id,
        createdAt: savedLocation.parent.createdAt,
        updatedAt: savedLocation.parent.updatedAt,
        tenantId: savedLocation.parent.tenantId,
        name: savedLocation.parent.name,
        metaTitle: savedLocation.parent.metaTitle,
        parentId: savedLocation.parent.parentId,
        type: savedLocation.parent.type,
        sort: savedLocation.parent.sort,
        deliveryFee: savedLocation.parent.deliveryFee,
        dropFee: savedLocation.parent.dropFee,
        minDayCount: savedLocation.parent.minDayCount,
        isActive: savedLocation.parent.isActive,
      } : null,
      type: savedLocation.type,
      sort: savedLocation.sort,
      deliveryFee: savedLocation.deliveryFee,
      dropFee: savedLocation.dropFee,
      minDayCount: savedLocation.minDayCount,
      isActive: savedLocation.isActive,
    };
  }

  static async getById(id: string): Promise<LocationDto | null> {
    const location = await this.locationRepo().findOne({
      where: { id },
      relations: ['parent'],
    });

    if (!location) {
      return null;
    }

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
    };
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

    return {
      id: reloadedLocation.id,
      createdAt: reloadedLocation.createdAt,
      updatedAt: reloadedLocation.updatedAt,
      tenantId: reloadedLocation.tenantId,
      name: reloadedLocation.name,
      metaTitle: reloadedLocation.metaTitle,
      parentId: reloadedLocation.parentId,
      parent: reloadedLocation.parent ? {
        id: reloadedLocation.parent.id,
        createdAt: reloadedLocation.parent.createdAt,
        updatedAt: reloadedLocation.parent.updatedAt,
        tenantId: reloadedLocation.parent.tenantId,
        name: reloadedLocation.parent.name,
        metaTitle: reloadedLocation.parent.metaTitle,
        parentId: reloadedLocation.parent.parentId,
        type: reloadedLocation.parent.type,
        sort: reloadedLocation.parent.sort,
        deliveryFee: reloadedLocation.parent.deliveryFee,
        dropFee: reloadedLocation.parent.dropFee,
        minDayCount: reloadedLocation.parent.minDayCount,
        isActive: reloadedLocation.parent.isActive,
      } : null,
      type: reloadedLocation.type,
      sort: reloadedLocation.sort,
      deliveryFee: reloadedLocation.deliveryFee,
      dropFee: reloadedLocation.dropFee,
      minDayCount: reloadedLocation.minDayCount,
      isActive: reloadedLocation.isActive,
    };
  }

  static async remove(id: string): Promise<void> {
    const location = await this.locationRepo().findOne({ where: { id } });
    if (!location) {
      throw new Error('Location not found');
    }
    await this.locationRepo().remove(location);
  }
}
