import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Blog } from './blog.entity';
import { Language } from './language.entity';

@Entity({ name: 'blog_translations' })
@Unique(['blogId', 'languageId'])
export class BlogTranslation extends BaseEntity {
  @ManyToOne(() => Blog, (blog) => blog.translations, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'blog_id' })
  blog!: Blog;

  @Column({ name: 'blog_id' })
  blogId!: string;

  @ManyToOne(() => Language, { nullable: false })
  @JoinColumn({ name: 'language_id' })
  language!: Language;

  @Column({ name: 'language_id' })
  languageId!: string;

  @Column({ length: 200 })
  title!: string;

  @Column({ length: 200, nullable: true })
  slug?: string;

  @Column({ type: 'text' })
  content!: string;
}

