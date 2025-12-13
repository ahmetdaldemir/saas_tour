import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../shared/entities/base.entity';
import { Language } from '../../shared/entities/language.entity';
import { Tour } from './tour.entity';

@Entity({ name: 'tour_translations' })
@Unique(['tourId', 'languageId'])
export class TourTranslation extends BaseEntity {
  @ManyToOne(() => Tour, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tour_id' })
  tour!: Tour;

  @Column({ name: 'tour_id' })
  tourId!: string;

  @ManyToOne(() => Language, { nullable: false })
  @JoinColumn({ name: 'language_id' })
  language!: Language;

  @Column({ name: 'language_id' })
  languageId!: string;

  @Column({ length: 200 })
  title!: string;

  @Column({ length: 200, nullable: true })
  slug?: string; // Language-specific slug

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'included_services', type: 'text', nullable: true })
  includedServices?: string; // JSON array of strings

  @Column({ name: 'excluded_services', type: 'text', nullable: true })
  excludedServices?: string; // JSON array of strings
}

