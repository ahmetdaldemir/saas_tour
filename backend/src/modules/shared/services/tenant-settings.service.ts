import { Repository } from 'typeorm';
import { AppDataSource } from '../../../config/data-source';
import { TenantSettings, SettingsCategory } from '../entities/tenant-settings.entity';

export type SiteSettingsInput = {
  siteName?: string;
  siteDescription?: string;
  logoUrl?: string;
  faviconUrl?: string;
  defaultCurrencyId?: string | null;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyWebsite?: string;
  companyTaxNumber?: string;
};

export type MailSettingsInput = {
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  smtpSecure?: boolean;
  fromEmail?: string;
  fromName?: string;
};

export type PaymentSettingsInput = {
  paymentDefaultMethodId?: string | null;
};

export type UpdateTenantSettingsInput = Partial<
  SiteSettingsInput & MailSettingsInput & PaymentSettingsInput
>;

export class TenantSettingsService {
  private static repository(): Repository<TenantSettings> {
    return AppDataSource.getRepository(TenantSettings);
  }

  static async getByTenant(tenantId: string): Promise<TenantSettings[]> {
    return this.repository().find({
      where: { tenantId },
      relations: ['defaultCurrency'],
      order: { category: 'ASC' },
    });
  }

  static async getByCategory(
    tenantId: string,
    category: SettingsCategory
  ): Promise<TenantSettings | null> {
    return this.repository().findOne({
      where: { tenantId, category },
      relations: ['defaultCurrency'],
    });
  }

  static async getSiteSettings(tenantId: string): Promise<TenantSettings | null> {
    return this.getByCategory(tenantId, SettingsCategory.SITE);
  }

  static async getMailSettings(tenantId: string): Promise<TenantSettings | null> {
    return this.getByCategory(tenantId, SettingsCategory.MAIL);
  }

  static async getPaymentSettings(tenantId: string): Promise<TenantSettings | null> {
    return this.getByCategory(tenantId, SettingsCategory.PAYMENT);
  }

  static async updateSiteSettings(
    tenantId: string,
    input: SiteSettingsInput
  ): Promise<TenantSettings> {
    const repo = this.repository();
    let settings = await repo.findOne({
      where: { tenantId, category: SettingsCategory.SITE },
    });

    if (!settings) {
      settings = repo.create({
        tenantId,
        category: SettingsCategory.SITE,
        ...input,
      });
    } else {
      Object.assign(settings, input);
    }

    return repo.save(settings);
  }

  static async updateMailSettings(
    tenantId: string,
    input: MailSettingsInput
  ): Promise<TenantSettings> {
    const repo = this.repository();
    let settings = await repo.findOne({
      where: { tenantId, category: SettingsCategory.MAIL },
    });

    if (!settings) {
      settings = repo.create({
        tenantId,
        category: SettingsCategory.MAIL,
        smtpSecure: true,
        ...input,
      });
    } else {
      Object.assign(settings, input);
    }

    return repo.save(settings);
  }

  static async updatePaymentSettings(
    tenantId: string,
    input: PaymentSettingsInput
  ): Promise<TenantSettings> {
    const repo = this.repository();
    let settings = await repo.findOne({
      where: { tenantId, category: SettingsCategory.PAYMENT },
    });

    if (!settings) {
      settings = repo.create({
        tenantId,
        category: SettingsCategory.PAYMENT,
        ...input,
      });
    } else {
      Object.assign(settings, input);
    }

    return repo.save(settings);
  }

  static async updateSettings(
    tenantId: string,
    category: SettingsCategory,
    input: UpdateTenantSettingsInput
  ): Promise<TenantSettings> {
    const repo = this.repository();
    let settings = await repo.findOne({
      where: { tenantId, category },
    });

    if (!settings) {
      settings = repo.create({
        tenantId,
        category,
        ...input,
      });
    } else {
      Object.assign(settings, input);
    }

    return repo.save(settings);
  }
}

