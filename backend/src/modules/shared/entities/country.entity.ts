import { Column, Entity, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity({ name: 'countries' })
@Unique(['code'])
export class Country extends BaseEntity {
  @Column({ length: 100 })
  name!: string;

  @Column({ length: 2, unique: true })
  code!: string; // ISO 3166-1 alpha-2 code (e.g., "US", "TR", "GB")

  @Column({ name: 'phone_code', length: 10 })
  phoneCode!: string; // e.g., "+1", "+90", "+44"

  @Column({ type: 'text', nullable: true })
  flag?: string; // Flag emoji or URL

  @Column({ name: 'is_active', default: true })
  isActive!: boolean;
}

