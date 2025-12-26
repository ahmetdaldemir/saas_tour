import { Repository } from 'typeorm';
import { AppDataSource } from '../../../config/data-source';
import { Tenant, TenantCategory } from '../entities/tenant.entity';
import { Currency } from '../../shared/entities/currency.entity';
import { logger } from '../../../utils/logger';

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
    
    // Load tenant WITHOUT relations to avoid TypeORM sync issues
    const tenant = await repo.findOne({
      where: { id: tenantId },
    });
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // If currencyId is provided, verify it exists
    if (currencyId !== null && currencyId !== undefined) {
      const currencyRepo = AppDataSource.getRepository(Currency);
      const currency = await currencyRepo.findOne({ where: { id: currencyId } });
      if (!currency) {
        logger.error(`Currency not found`, { currencyId, tenantId });
        throw new Error(`Currency with id ${currencyId} not found`);
      }
    }

    logger.info(`Updating default currency for tenant ${tenantId} to ${currencyId}`);
    
    // Use update method instead of save to avoid relation sync issues
    await repo.update({ id: tenantId }, { defaultCurrencyId: currencyId ?? null });
    
    // Reload with relations to ensure defaultCurrency is loaded
    const updatedTenant = await repo.findOne({
      where: { id: tenantId },
      relations: ['defaultCurrency'],
    });
    
    if (!updatedTenant) {
      logger.error(`Failed to reload tenant after currency update`, { tenantId });
      throw new Error('Failed to update default currency');
    }
    
    // Verify the update was successful
    if (updatedTenant.defaultCurrencyId !== (currencyId ?? null)) {
      logger.error(`Currency update mismatch. Expected: ${currencyId ?? null}, Got: ${updatedTenant.defaultCurrencyId}`, { 
        tenantId, 
        expected: currencyId ?? null,
        actual: updatedTenant.defaultCurrencyId 
      });
      throw new Error('Default currency update failed - value mismatch');
    }
    
    logger.info(`Successfully updated default currency for tenant ${tenantId}`, {
      tenantId,
      currencyId: updatedTenant.defaultCurrencyId,
    });
    
    return updatedTenant;
  }
}
