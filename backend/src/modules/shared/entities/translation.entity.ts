import { Column, Entity, JoinColumn, ManyToOne, Unique, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Language } from './language.entity';

@Entity({ name: 'translations' })
@Unique(['model', 'modelId', 'languageId'])
@Index(['model', 'modelId'])
export class Translation extends BaseEntity {
  @Column({ length: 100 })
  model!: string; // Entity name (e.g., 'Destination', 'Tour', 'Blog')

  @Column({ name: 'model_id', type: 'uuid' })
  modelId!: string; // Foreign key to the related entity

  @ManyToOne(() => Language, { nullable: false })
  @JoinColumn({ name: 'language_id' })
  language!: Language;

  @Column({ name: 'language_id', type: 'uuid' })
  languageId!: string;

  @Column({ length: 200 })
  name!: string; // Title/Name field

  @Column({ type: 'text', nullable: true })
  value?: string; // Generic value field for description, shortDescription, or any other content
}

