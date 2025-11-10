import { Column, Entity, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity({ name: 'languages' })
@Unique(['code'])
export class Language extends BaseEntity {
  @Column({ length: 8 })
  code!: string;

  @Column({ length: 64 })
  name!: string;

  @Column({ default: true })
  isActive!: boolean;
}
