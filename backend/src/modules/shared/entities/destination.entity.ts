import { Column, Entity } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity({ name: 'destinations' })
export class Destination extends BaseEntity {
  @Column({ length: 120 })
  name!: string;

  @Column({ length: 80 })
  country!: string;

  @Column({ length: 80 })
  city!: string;
}
