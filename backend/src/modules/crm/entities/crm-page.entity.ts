import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../shared/entities/base.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { CrmPageCategory } from './crm-page-category.entity';

/**
 * CRM Page Entity
 * Pages for CRM module (e.g., Privacy Policy, Terms of Service, Help articles)
 * Multi-language support via Translation entity
 */
@Entity({ name: 'crm_pages' })
export class CrmPage extends BaseEntity {
  @ManyToOne(() => Tenant, { nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId!: string;

  @ManyToOne(() => CrmPageCategory, { nullable: false })
  @JoinColumn({ name: 'category_id' })
  category!: CrmPageCategory;

  @Column({ name: 'category_id', type: 'uuid' })
  categoryId!: string;

  @Column({ type: 'varchar', length: 200 })
  slug!: string; // URL-friendly identifier

  @Column({ type: 'varchar', length: 500, nullable: true })
  image?: string; // Image URL

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number; // For ordering pages within category

  @Column({ name: 'view_count', type: 'int', default: 0 })
  viewCount!: number; // Track page views

  // Note: title and description are stored in Translation entity with model='CrmPage'
  // title -> Translation.name
  // description -> Translation.value
}

