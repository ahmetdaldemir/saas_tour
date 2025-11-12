import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../../shared/entities/base.entity';
import { VehicleCategoryTranslation } from './vehicle-category-translation.entity';

@Entity({ name: 'vehicle_categories' })
export class VehicleCategory extends BaseEntity {
  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;

  @OneToMany(() => VehicleCategoryTranslation, (translation) => translation.category, { cascade: true })
  translations!: VehicleCategoryTranslation[];
}

