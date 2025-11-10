import { Column, Entity, JoinColumn, ManyToMany, ManyToOne, OneToMany, JoinTable } from 'typeorm';
import { BaseEntity } from '../../shared/entities/base.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Destination } from '../../shared/entities/destination.entity';
import { Language } from '../../shared/entities/language.entity';
import { TourSession } from './tour-session.entity';

@Entity({ name: 'tours' })
export class Tour extends BaseEntity {
  @ManyToOne(() => Tenant, { nullable: false })
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant;

  @Column({ name: 'tenant_id' })
  tenantId!: string;

  @ManyToOne(() => Destination, { nullable: false })
  @JoinColumn({ name: 'destination_id' })
  destination!: Destination;

  @Column({ name: 'destination_id' })
  destinationId!: string;

  @Column({ length: 200 })
  title!: string;

  @Column({ length: 200 })
  slug!: string;

  @Column({ type: 'text', nullable: true })
  summary?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  basePrice!: number;

  @Column({ name: 'currency_code', length: 3, default: 'EUR' })
  currencyCode!: string;

  @Column({ name: 'duration_hours', type: 'int', default: 24 })
  durationHours!: number;

  @Column({ type: 'simple-array', nullable: true })
  tags?: string[];

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @ManyToMany(() => Language)
  @JoinTable({
    name: 'tour_languages',
    joinColumn: { name: 'tour_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'language_id', referencedColumnName: 'id' },
  })
  languages!: Language[];

  @OneToMany(() => TourSession, (session) => session.tour)
  sessions!: TourSession[];
}
