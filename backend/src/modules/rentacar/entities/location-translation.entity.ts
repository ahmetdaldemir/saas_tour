import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from '../../shared/entities/base.entity';
import { Location } from './location.entity';
import { Language } from '../../shared/entities/language.entity';

@Entity({ name: 'rentacar_location_translations' })
@Unique(['locationId', 'languageId'])
export class LocationTranslation extends BaseEntity {
  @ManyToOne(() => Location, (location) => location.translations, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'location_id' })
  location!: Location;

  @Column({ name: 'location_id' })
  locationId!: string;

  @ManyToOne(() => Language, { nullable: false })
  @JoinColumn({ name: 'language_id' })
  language!: Language;

  @Column({ name: 'language_id' })
  languageId!: string;

  @Column({ length: 200 })
  name!: string;

  @Column({ name: 'meta_title', type: 'text', nullable: true })
  metaTitle?: string;
}

