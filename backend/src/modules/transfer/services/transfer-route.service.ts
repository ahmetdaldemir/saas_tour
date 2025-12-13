import { Repository } from 'typeorm';
import { AppDataSource } from '../../../config/data-source';
import { TransferRoute, TransferRouteType } from '../entities/transfer-route.entity';
import { TransferRoutePoint, RoutePointType } from '../entities/transfer-route-point.entity';

export type CreateTransferRouteInput = {
  tenantId: string;
  name: string;
  type: TransferRouteType;
  points: Array<{
    name: string;
    type: RoutePointType;
    address?: string;
    latitude?: string;
    longitude?: string;
    isPickup: boolean;
    isActive?: boolean;
  }>;
  distance?: number;
  averageDurationMinutes?: number;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
};

export type UpdateTransferRouteInput = Partial<Omit<CreateTransferRouteInput, 'tenantId'>> & {
  points?: Array<{
    id?: string;
    name: string;
    type: RoutePointType;
    address?: string;
    latitude?: string;
    longitude?: string;
    isPickup: boolean;
    isActive?: boolean;
  }>;
};

export class TransferRouteService {
  private static routeRepo(): Repository<TransferRoute> {
    return AppDataSource.getRepository(TransferRoute);
  }

  private static pointRepo(): Repository<TransferRoutePoint> {
    return AppDataSource.getRepository(TransferRoutePoint);
  }

  static async list(tenantId: string): Promise<TransferRoute[]> {
    return this.routeRepo().find({
      where: { tenantId },
      relations: ['points'],
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  static async getById(id: string, tenantId: string): Promise<TransferRoute | null> {
    return this.routeRepo().findOne({
      where: { id, tenantId },
      relations: ['points'],
    });
  }

  static async create(input: CreateTransferRouteInput): Promise<TransferRoute> {
    const route = this.routeRepo().create({
      tenantId: input.tenantId,
      name: input.name,
      type: input.type,
      distance: input.distance,
      averageDurationMinutes: input.averageDurationMinutes,
      description: input.description,
      isActive: input.isActive ?? true,
      sortOrder: input.sortOrder ?? 0,
    });

    const savedRoute = await this.routeRepo().save(route);

    // Create route points
    if (input.points && input.points.length > 0) {
      const points = input.points.map((point) =>
        this.pointRepo().create({
          routeId: savedRoute.id,
          ...point,
          isActive: point.isActive ?? true,
        })
      );
      savedRoute.points = await this.pointRepo().save(points);
    }

    return savedRoute;
  }

  static async update(id: string, tenantId: string, input: UpdateTransferRouteInput): Promise<TransferRoute> {
    const route = await this.getById(id, tenantId);
    if (!route) {
      throw new Error('Transfer route not found');
    }

    Object.assign(route, {
      name: input.name,
      type: input.type,
      distance: input.distance,
      averageDurationMinutes: input.averageDurationMinutes,
      description: input.description,
      isActive: input.isActive,
      sortOrder: input.sortOrder,
    });

    // Update points if provided
    if (input.points) {
      // Delete existing points
      await this.pointRepo().delete({ routeId: route.id });

      // Create new points
      const points = input.points.map((point) =>
        this.pointRepo().create({
          routeId: route.id,
          name: point.name,
          type: point.type,
          address: point.address,
          latitude: point.latitude,
          longitude: point.longitude,
          isPickup: point.isPickup,
          isActive: point.isActive ?? true,
        })
      );
      route.points = await this.pointRepo().save(points);
    }

    return this.routeRepo().save(route);
  }

  static async delete(id: string, tenantId: string): Promise<void> {
    const route = await this.getById(id, tenantId);
    if (!route) {
      throw new Error('Transfer route not found');
    }
    await this.routeRepo().remove(route);
  }
}

