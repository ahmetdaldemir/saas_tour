import { Repository } from 'typeorm';
import { AppDataSource } from '../../../config/data-source';
import { TransferVehicle, TransferVehicleType, TransferVehicleFeature } from '../entities/transfer-vehicle.entity';

export type CreateTransferVehicleInput = {
  tenantId: string;
  name: string;
  type: TransferVehicleType;
  passengerCapacity: number;
  luggageCapacity: number;
  hasDriver?: boolean;
  features?: TransferVehicleFeature[];
  imageUrl?: string;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
};

export type UpdateTransferVehicleInput = Partial<CreateTransferVehicleInput>;

export class TransferVehicleService {
  private static vehicleRepo(): Repository<TransferVehicle> {
    return AppDataSource.getRepository(TransferVehicle);
  }

  static async list(tenantId: string): Promise<TransferVehicle[]> {
    return this.vehicleRepo().find({
      where: { tenantId },
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  static async getById(id: string, tenantId: string): Promise<TransferVehicle | null> {
    return this.vehicleRepo().findOne({
      where: { id, tenantId },
    });
  }

  static async create(input: CreateTransferVehicleInput): Promise<TransferVehicle> {
    const vehicle = this.vehicleRepo().create({
      ...input,
      hasDriver: input.hasDriver ?? true, // Default: şoförlü
      isActive: input.isActive ?? true,
      sortOrder: input.sortOrder ?? 0,
    });
    return this.vehicleRepo().save(vehicle);
  }

  static async update(id: string, tenantId: string, input: UpdateTransferVehicleInput): Promise<TransferVehicle> {
    const vehicle = await this.getById(id, tenantId);
    if (!vehicle) {
      throw new Error('Transfer vehicle not found');
    }

    Object.assign(vehicle, input);
    return this.vehicleRepo().save(vehicle);
  }

  static async delete(id: string, tenantId: string): Promise<void> {
    const vehicle = await this.getById(id, tenantId);
    if (!vehicle) {
      throw new Error('Transfer vehicle not found');
    }
    await this.vehicleRepo().remove(vehicle);
  }
}

