import { In, Repository } from 'typeorm';
import { AppDataSource } from '../../../config/data-source';
import { Tour } from '../entities/tour.entity';
import { Tenant, TenantCategory } from '../../tenants/entities/tenant.entity';
import { Destination } from '../../shared/entities/destination.entity';
import { Language } from '../../shared/entities/language.entity';

export type CreateTourInput = {
  tenantId: string;
  destinationId: string;
  title: string;
  slug: string;
  summary?: string;
  description?: string;
  basePrice?: number;
  currencyCode?: string;
  durationHours?: number;
  languageIds?: string[];
  tags?: string[];
};

export class TourService {
  private static tourRepo(): Repository<Tour> {
    return AppDataSource.getRepository(Tour);
  }

  static async createTour(input: CreateTourInput): Promise<Tour> {
    const tenantRepo = AppDataSource.getRepository(Tenant);
    const destinationRepo = AppDataSource.getRepository(Destination);
    const languageRepo = AppDataSource.getRepository(Language);

    const tenant = await tenantRepo.findOne({ where: { id: input.tenantId } });
    if (!tenant) {
      throw new Error('Tenant not found');
    }
    if (tenant.category !== TenantCategory.TOUR) {
      throw new Error('Tenant category must be tour');
    }

    const destination = await destinationRepo.findOne({ where: { id: input.destinationId } });
    if (!destination) {
      throw new Error('Destination not found');
    }

    let languages: Language[] = [];
    if (input.languageIds?.length) {
      languages = await languageRepo.find({ where: { id: In(input.languageIds) } });
    }

    const tour = this.tourRepo().create({
      tenant,
      destination,
      title: input.title,
      slug: input.slug,
      summary: input.summary,
      description: input.description,
      basePrice: input.basePrice ?? 0,
      currencyCode: input.currencyCode ?? 'EUR',
      durationHours: input.durationHours ?? 24,
      tags: input.tags,
      languages,
    });

    return this.tourRepo().save(tour);
  }

  static listTours(tenantId: string): Promise<Tour[]> {
    return this.tourRepo().find({ where: { tenantId }, relations: ['destination', 'languages'] });
  }
}
