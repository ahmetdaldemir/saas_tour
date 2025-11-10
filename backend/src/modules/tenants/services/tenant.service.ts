import { Repository } from 'typeorm';
import { AppDataSource } from '../../../config/data-source';
import { Tenant, TenantCategory } from '../entities/tenant.entity';

export type CreateTenantInput = {
  name: string;
  slug: string;
  category: TenantCategory;
  defaultLanguage?: string;
  supportEmail?: string;
};

export class TenantService {
  private static repository(): Repository<Tenant> {
    return AppDataSource.getRepository(Tenant);
  }

  static async createTenant(input: CreateTenantInput): Promise<Tenant> {
    const repo = this.repository();
    const existing = await repo.findOne({ where: { slug: input.slug } });
    if (existing) {
      throw new Error('Tenant with this slug already exists');
    }

    const tenant = repo.create({
      name: input.name,
      slug: input.slug,
      category: input.category,
      defaultLanguage: input.defaultLanguage ?? 'en',
      supportEmail: input.supportEmail,
    });

    return repo.save(tenant);
  }

  static listTenants(): Promise<Tenant[]> {
    return this.repository().find();
  }
}
