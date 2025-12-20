import { Repository, In } from 'typeorm';
import { AppDataSource } from '../../../config/data-source';
import { Blog, BlogStatus } from '../entities/blog.entity';
import { Translation } from '../entities/translation.entity';
import { Language } from '../entities/language.entity';
import { TranslationService } from './translation.service';

export type BlogTranslationInput = {
  languageId: string;
  title: string;
  slug?: string;
  content: string;
};

export type CreateBlogDto = {
  tenantId: string;
  locationId?: string | null;
  title: string;
  slug?: string;
  content: string;
  status?: BlogStatus;
  publishedAt?: Date | null;
  translations?: BlogTranslationInput[];
};

export type UpdateBlogDto = Partial<Omit<CreateBlogDto, 'tenantId'>>;

export type BlogWithTranslations = Blog & {
  translations?: Translation[];
};

const MODEL_NAME = 'Blog';

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export class BlogService {
  private static repo(): Repository<Blog> {
    return AppDataSource.getRepository(Blog);
  }

  private static translationRepo(): Repository<Translation> {
    return AppDataSource.getRepository(Translation);
  }

  private static languageRepo(): Repository<Language> {
    return AppDataSource.getRepository(Language);
  }

  static async list(tenantId: string, locationId?: string | null): Promise<BlogWithTranslations[]> {
    const query = this.repo()
      .createQueryBuilder('blog')
      .leftJoinAndSelect('blog.location', 'location')
      .where('blog.tenantId = :tenantId', { tenantId })
      .orderBy('blog.createdAt', 'DESC');

    if (locationId === null || locationId === undefined) {
      // If locationId is explicitly null or undefined, show all (including general)
      // No additional filter needed
    } else if (locationId === 'general' || locationId === '') {
      // Show only general blogs (locationId is null)
      query.andWhere('blog.locationId IS NULL');
    } else {
      // Show blogs for specific location or general
      query.andWhere('(blog.locationId = :locationId OR blog.locationId IS NULL)', { locationId });
    }

    const blogs = await query.getMany();
    const blogIds = blogs.map(b => b.id);

    // Fetch translations for all blogs
    const translations = blogIds.length > 0
      ? await this.translationRepo().find({
          where: {
            model: MODEL_NAME,
            modelId: In(blogIds),
          },
          relations: ['language'],
        })
      : [];

    // Group translations by blog
    const translationsByBlog = new Map<string, Translation[]>();
    translations.forEach(t => {
      const key = t.modelId;
      if (!translationsByBlog.has(key)) {
        translationsByBlog.set(key, []);
      }
      translationsByBlog.get(key)!.push(t);
    });

    // Combine blogs with translations
    return blogs.map(blog => ({
      ...blog,
      translations: translationsByBlog.get(blog.id) || [],
    }));
  }

  static async getById(id: string): Promise<BlogWithTranslations | null> {
    const blog = await this.repo().findOne({
      where: { id },
      relations: ['location'],
    });

    if (!blog) {
      return null;
    }

    const translations = await this.translationRepo().find({
      where: {
        model: MODEL_NAME,
        modelId: id,
      },
      relations: ['language'],
    });

    return {
      ...blog,
      translations,
    };
  }

  static async create(input: CreateBlogDto): Promise<Blog> {
    const slug = input.slug || slugify(input.title);

    // Check if slug already exists for this tenant
    const existing = await this.repo().findOne({
      where: {
        tenantId: input.tenantId,
        slug,
      },
    });

    if (existing) {
      throw new Error('Blog with this slug already exists');
    }

    const blog = this.repo().create({
      tenantId: input.tenantId,
      locationId: input.locationId === 'general' || input.locationId === '' ? null : input.locationId || null,
      title: input.title,
      slug,
      content: input.content,
      status: input.status || BlogStatus.DRAFT,
      publishedAt: input.publishedAt || (input.status === BlogStatus.PUBLISHED ? new Date() : null),
    });

    const savedBlog = await this.repo().save(blog);

    // Handle translations if provided
    if (input.translations && input.translations.length > 0) {
      const defaultLanguage = await this.languageRepo().findOne({ where: { isDefault: true } });
      const defaultTranslation = input.translations.find(
        (t) => defaultLanguage && t.languageId === defaultLanguage.id
      ) || input.translations[0];

      const translationEntities = await Promise.all(
        input.translations.map(async (t) => {
          const language = await this.languageRepo().findOne({ where: { id: t.languageId } });
          if (!language) {
            throw new Error(`Language with ID ${t.languageId} not found`);
          }

          let title = t.title || '';
          let content = t.content || '';

          // Auto-translate only if translation is empty and not default language
          if (!title && !content && defaultLanguage && t.languageId !== defaultLanguage.id && defaultTranslation) {
            try {
              title = await TranslationService.translateText({
                text: defaultTranslation.title,
                targetLanguageCode: language.code,
                sourceLanguageCode: defaultLanguage.code,
              });
            } catch (error) {
              console.error('Auto-translation failed for title:', error);
            }

            try {
              content = await TranslationService.translateText({
                text: defaultTranslation.content,
                targetLanguageCode: language.code,
                sourceLanguageCode: defaultLanguage.code,
              });
            } catch (error) {
              console.error('Auto-translation failed for content:', error);
            }
          }

          // Store content in value field (name = title)
          return this.translationRepo().create({
            model: MODEL_NAME,
            modelId: savedBlog.id,
            languageId: t.languageId,
            name: title,
            value: content ? JSON.stringify({ content }) : undefined,
          });
        })
      );

      await this.translationRepo().save(translationEntities);
    }

    return savedBlog;
  }

  static async update(id: string, input: UpdateBlogDto): Promise<Blog> {
    const blog = await this.repo().findOne({ where: { id } });
    if (!blog) {
      throw new Error('Blog not found');
    }

    if (typeof input.title === 'string') {
      blog.title = input.title;
      if (!input.slug) {
        blog.slug = slugify(input.title);
      }
    }
    if (typeof input.slug === 'string') {
      blog.slug = slugify(input.slug);
    }
    if (typeof input.content === 'string') {
      blog.content = input.content;
    }
    if (input.status !== undefined) {
      blog.status = input.status;
      if (input.status === BlogStatus.PUBLISHED && !blog.publishedAt) {
        blog.publishedAt = new Date();
      }
    }
    if (input.locationId !== undefined) {
      blog.locationId = input.locationId === 'general' || input.locationId === '' ? null : input.locationId || null;
    }
    if (input.publishedAt !== undefined) {
      blog.publishedAt = input.publishedAt;
    }

    const savedBlog = await this.repo().save(blog);

    // Handle translations if provided
    if (input.translations !== undefined) {
      await this.translationRepo().delete({
        model: MODEL_NAME,
        modelId: id,
      });

      if (input.translations.length > 0) {
        const defaultLanguage = await this.languageRepo().findOne({ where: { isDefault: true } });
        const defaultTranslation = input.translations.find(
          (t) => defaultLanguage && t.languageId === defaultLanguage.id
        ) || input.translations[0];

        const translationEntities = await Promise.all(
          input.translations.map(async (t) => {
            const language = await this.languageRepo().findOne({ where: { id: t.languageId } });
            if (!language) {
              throw new Error(`Language with ID ${t.languageId} not found`);
            }

            let title = t.title || '';
            let content = t.content || '';

            // Auto-translate only if translation is empty and not default language
            if (!title && !content && defaultLanguage && t.languageId !== defaultLanguage.id && defaultTranslation) {
              try {
                title = await TranslationService.translateText({
                  text: defaultTranslation.title,
                  targetLanguageCode: language.code,
                  sourceLanguageCode: defaultLanguage.code,
                });
              } catch (error) {
                console.error('Auto-translation failed for title:', error);
              }

              try {
                content = await TranslationService.translateText({
                  text: defaultTranslation.content,
                  targetLanguageCode: language.code,
                  sourceLanguageCode: defaultLanguage.code,
                });
              } catch (error) {
                console.error('Auto-translation failed for content:', error);
              }
            }

            // Store content in value field (name = title)
            return this.translationRepo().create({
              model: MODEL_NAME,
              modelId: id,
              languageId: t.languageId,
              name: title,
              value: content ? JSON.stringify({ content }) : undefined,
            });
          })
        );

        await this.translationRepo().save(translationEntities);
      }
    }

    return savedBlog;
  }

  static async remove(id: string): Promise<void> {
    const blog = await this.repo().findOne({ where: { id } });
    if (!blog) {
      throw new Error('Blog not found');
    }

    // Delete translations first
    await this.translationRepo().delete({
      model: MODEL_NAME,
      modelId: id,
    });

    await this.repo().remove(blog);
  }
}
