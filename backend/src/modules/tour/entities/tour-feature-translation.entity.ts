import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../shared/entities/base.entity';
import { Language } from '../../shared/entities/language.entity';
import { TourFeature } from './tour-feature.entity';

@Entity({ name: 'tour_feature_translations' })
@Unique(['featureId', 'languageId'])
export class TourFeatureTranslation extends BaseEntity {
  @ManyToOne(() => TourFeature, (feature) => feature.translations, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'feature_id' })
  feature!: TourFeature;

  @Column({ name: 'feature_id' })
  featureId!: string;

  @ManyToOne(() => Language, { nullable: false })
  @JoinColumn({ name: 'language_id' })
  language!: Language;

  @Column({ name: 'language_id' })
  languageId!: string;

  @Column({ length: 120 })
  name!: string; // Translated feature name
}

