import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../shared/entities/base.entity';
import { VehicleCategory } from './vehicle-category.entity';
import { Language } from '../../shared/entities/language.entity';

@Entity({ name: 'vehicle_category_translations' })
@Unique(['categoryId', 'languageId'])
export class VehicleCategoryTranslation extends BaseEntity {
  @ManyToOne(() => VehicleCategory, (category) => category.translations, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'category_id' })
  category!: VehicleCategory;

  @Column({ name: 'category_id' })
  categoryId!: string;

  @ManyToOne(() => Language, { nullable: false })
  @JoinColumn({ name: 'language_id' })
  language!: Language;

  @Column({ name: 'language_id' })
  languageId!: string;

  @Column({ length: 120 })
  name!: string;
}

