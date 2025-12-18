import { Column, Entity } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity({ name: 'destinations' })
export class Destination extends BaseEntity {
  @Column({ type: 'text', nullable: true })
  image?: string;

  @Column({ name: 'is_featured', default: false })
  isFeatured!: boolean;
}
