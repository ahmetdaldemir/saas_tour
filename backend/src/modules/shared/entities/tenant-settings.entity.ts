import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Currency } from './currency.entity';

export enum SettingsCategory {
  SITE = 'site',
  MAIL = 'mail',
  PAYMENT = 'payment',
  GENERAL = 'general',
}

@Entity({ name: 'tenant_settings' })
@Unique(['tenantId', 'category'])
export class TenantSettings extends BaseEntity {
  @ManyToOne(() => Tenant, { nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant;

  @Column({ name: 'tenant_id' })
  tenantId!: string;

  @Column({ type: 'enum', enum: SettingsCategory })
  category!: SettingsCategory;

  // Site Settings
  @Column({ name: 'site_name', length: 200, nullable: true })
  siteName?: string;

  @Column({ name: 'site_description', type: 'text', nullable: true })
  siteDescription?: string;

  @Column({ name: 'logo_url', type: 'text', nullable: true })
  logoUrl?: string;

  @Column({ name: 'favicon_url', type: 'text', nullable: true })
  faviconUrl?: string;

  @ManyToOne(() => Currency, { nullable: true })
  @JoinColumn({ name: 'default_currency_id' })
  defaultCurrency?: Currency | null;

  @Column({ name: 'default_currency_id', type: 'uuid', nullable: true })
  defaultCurrencyId?: string | null;

  // Mail Settings
  @Column({ name: 'smtp_host', length: 200, nullable: true })
  smtpHost?: string;

  @Column({ name: 'smtp_port', type: 'int', nullable: true })
  smtpPort?: number;

  @Column({ name: 'smtp_user', length: 200, nullable: true })
  smtpUser?: string;

  @Column({ name: 'smtp_password', length: 500, nullable: true })
  smtpPassword?: string;

  @Column({ name: 'smtp_secure', default: true })
  smtpSecure!: boolean; // TLS/SSL

  @Column({ name: 'from_email', length: 200, nullable: true })
  fromEmail?: string;

  @Column({ name: 'from_name', length: 200, nullable: true })
  fromName?: string;

  // Payment Settings
  @Column({ name: 'payment_default_method_id', type: 'uuid', nullable: true })
  paymentDefaultMethodId?: string | null;

  // Company/Address Information (for email templates)
  @Column({ name: 'company_name', length: 200, nullable: true })
  companyName?: string;

  @Column({ name: 'company_address', type: 'text', nullable: true })
  companyAddress?: string;

  @Column({ name: 'company_phone', length: 50, nullable: true })
  companyPhone?: string;

  @Column({ name: 'company_email', length: 160, nullable: true })
  companyEmail?: string;

  @Column({ name: 'company_website', length: 255, nullable: true })
  companyWebsite?: string;

  @Column({ name: 'company_tax_number', length: 50, nullable: true })
  companyTaxNumber?: string;

  // Additional settings as JSONB for flexibility
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;
}

