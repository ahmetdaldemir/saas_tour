import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';

@Entity({ name: 'destinations' })
export class Destination extends BaseEntity {
  @ManyToOne(() => Tenant, { nullable: true })
  @JoinColumn({ name: 'tenant_id' })
  tenant?: Tenant;

  @Column({ name: 'tenant_id', nullable: true })
  tenantId?: string;

  @Column({ type: 'text', nullable: true })
  image?: string;

  @Column({ name: 'is_featured', default: false })
  isFeatured!: boolean;
}
