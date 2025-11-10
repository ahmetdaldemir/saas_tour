import { Repository } from 'typeorm';
import { AppDataSource } from '../../../config/data-source';
import { Destination } from '../entities/destination.entity';

export type CreateDestinationDto = {
  name: string;
  country: string;
  city: string;
};

export type UpdateDestinationDto = Partial<CreateDestinationDto>;

export class DestinationService {
  private static repo(): Repository<Destination> {
    return AppDataSource.getRepository(Destination);
  }

  static list(): Promise<Destination[]> {
    return this.repo().find({ order: { name: 'ASC' } });
  }

  static async create(input: CreateDestinationDto): Promise<Destination> {
    const existing = await this.repo().findOne({
      where: {
        name: input.name,
        city: input.city,
        country: input.country,
      },
    });
    if (existing) {
      return existing;
    }

    const destination = this.repo().create({
      name: input.name,
      country: input.country,
      city: input.city,
    });

    return this.repo().save(destination);
  }

  static async update(id: string, input: UpdateDestinationDto): Promise<Destination> {
    const destination = await this.repo().findOne({ where: { id } });
    if (!destination) {
      throw new Error('Destination not found');
    }

    if (typeof input.name === 'string') {
      destination.name = input.name;
    }
    if (typeof input.country === 'string') {
      destination.country = input.country;
    }
    if (typeof input.city === 'string') {
      destination.city = input.city;
    }

    return this.repo().save(destination);
  }

  static async remove(id: string): Promise<void> {
    const destination = await this.repo().findOne({ where: { id } });
    if (!destination) {
      throw new Error('Destination not found');
    }
    await this.repo().remove(destination);
  }
}
