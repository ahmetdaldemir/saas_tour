import { Repository } from 'typeorm';
import { AppDataSource } from '../../../config/data-source';
import { Tenant, TenantCategory } from '../entities/tenant.entity';

export type CreateTenantInput = {
  name: string;
  slug: string;
  category: TenantCategory;
  defaultLanguage?: string;
  supportEmail?: string;
  defaultCurrencyId?: string | null;
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
      defaultCurrencyId: input.defaultCurrencyId,
    });

    return repo.save(tenant);
  }

  static listTenants(): Promise<Tenant[]> {
    return this.repository().find({
      relations: ['defaultCurrency'],
    });
  }

  static async getTenantById(id: string): Promise<Tenant | null> {
    return this.repository().findOne({
      where: { id },
      relations: ['defaultCurrency'],
    });
  }

  static async getTenantBySlug(slug: string): Promise<Tenant | null> {
    return this.repository().findOne({
      where: { slug, isActive: true },
      relations: ['defaultCurrency'],
    });
  }

  static async updateTenant(
    id: string,
    input: Partial<CreateTenantInput>
  ): Promise<Tenant> {
    const repo = this.repository();
    const tenant = await repo.findOne({ where: { id } });
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    Object.assign(tenant, input);
    return repo.save(tenant);
  }

  static async updateDefaultCurrency(
    tenantId: string,
    currencyId: string | null
  ): Promise<Tenant> {
    const repo = this.repository();
    const tenant = await repo.findOne({
      where: { id: tenantId },
      relations: ['defaultCurrency'],
    });
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    tenant.defaultCurrencyId = currencyId;
    return repo.save(tenant);
  }
}
