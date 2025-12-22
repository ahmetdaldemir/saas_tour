import { Repository, In } from 'typeorm';
import { AppDataSource } from '../../../config/data-source';
import { Blog, BlogStatus } from '../entities/blog.entity';
import { Translation } from '../entities/translation.entity';
import { Language } from '../entities/language.entity';
import { TranslationService } from './translation.service';
import { BlogAiService } from './blog-ai.service';
import { LanguageService } from './language.service';

export type BlogTranslationInput = {
  languageId: string;
  title: string;
  slug?: string; // Optional slug, will be generated from title if not provided
  content: string;
  short_description?: string; // Optional short description from AI
};

export type CreateBlogDto = {
  tenantId: string;
  locationId?: string | null;
  status?: BlogStatus;
  publishedAt?: Date | null;
  image?: string;
  translations: BlogTranslationInput[]; // Required - at least one translation needed
  // AI generation flags
  generateAiContent?: boolean; // If true, generate AI content from title (first translation's title)
  aiTone?: 'kurumsal' | 'samimi' | 'satis'; // Content tone for AI generation
};

export type UpdateBlogDto = {
  locationId?: string | null;
  status?: BlogStatus;
  publishedAt?: Date | null;
  image?: string;
  translations?: BlogTranslationInput[]; // Optional - if provided, replaces all translations
};

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

  static async list(tenantId: string, languageId?: string, locationId?: string | null): Promise<BlogWithTranslations[]> {
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

    // Build translation query - filter by languageId if provided
    const translationWhere: any = {
      model: MODEL_NAME,
      modelId: In(blogIds),
    };
    
    if (languageId) {
      translationWhere.languageId = languageId;
    }

    // Fetch translations for all blogs
    const translations = blogIds.length > 0
      ? await this.translationRepo().find({
          where: translationWhere,
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

    // If languageId provided, only return blogs that have translation in that language
    let filteredBlogs = blogs;
    if (languageId) {
      filteredBlogs = blogs.filter(blog => 
        translationsByBlog.has(blog.id)
      );
    }

    // Combine blogs with translations
    return filteredBlogs.map(blog => ({
      ...blog,
      translations: translationsByBlog.get(blog.id) || [],
    }));
  }

  static async getById(id: string, languageId?: string): Promise<BlogWithTranslations | null> {
    const blog = await this.repo().findOne({
      where: { id },
      relations: ['location'],
    });

    if (!blog) {
      return null;
    }

    const translationWhere: any = {
      model: MODEL_NAME,
      modelId: id,
    };
    
    if (languageId) {
      translationWhere.languageId = languageId;
    }

    const translations = await this.translationRepo().find({
      where: translationWhere,
      relations: ['language'],
    });

    return {
      ...blog,
      translations,
    };
  }

  static async create(input: CreateBlogDto): Promise<BlogWithTranslations> {
    // Validate translations
    if (!input.translations || input.translations.length === 0) {
      throw new Error('At least one translation is required');
    }

    // Get default language translation for slug check
    const defaultLang = await this.languageRepo().findOne({ where: { isDefault: true } });
    const defaultTrans = input.translations.find(
      (t) => defaultLang && t.languageId === defaultLang.id
    ) || input.translations[0];

    if (!defaultTrans || !defaultTrans.title) {
      throw new Error('Title is required in at least one translation');
    }

    // Generate slug from default translation title
    const slug = defaultTrans.slug || slugify(defaultTrans.title);

    // Check if slug already exists for this tenant (check in translations)
    const existingBlogs = await this.repo().find({
      where: { tenantId: input.tenantId },
    });

    if (existingBlogs.length > 0) {
      const existingBlogIds = existingBlogs.map(b => b.id);
      const existingTranslations = await this.translationRepo().find({
        where: {
          model: MODEL_NAME,
          modelId: In(existingBlogIds),
          name: slug, // Check if slug exists as name in translations
        },
      });

      if (existingTranslations.length > 0) {
        throw new Error('Blog with this slug already exists');
      }
    }

    // Generate AI content if requested
    let translations: BlogTranslationInput[] = input.translations;

    if (input.generateAiContent && defaultTrans.title && defaultTrans.title.trim()) {
      try {
        // Generate AI content
        const aiContent = await BlogAiService.generateBlogContent({
          title: defaultTrans.title.trim(),
          tone: input.aiTone || 'kurumsal',
          regenerate: false,
          tenantId: input.tenantId, // Required for tenant-specific AI settings
        });

        // Get all active languages
        const allLanguages = await LanguageService.list();
        const activeLanguages = allLanguages.filter(lang => lang.isActive);

        // Build translations from AI content
        translations = activeLanguages
          .map(lang => {
            const langContent = aiContent[lang.code];
            if (!langContent) return null;

            return {
              languageId: lang.id,
              title: langContent.title,
              slug: slugify(langContent.title), // Generate slug from title
              content: langContent.content,
              short_description: langContent.short_description, // Include short_description from AI
            };
          })
          .filter(t => t !== null) as BlogTranslationInput[];
      } catch (error) {
        console.error('AI content generation failed:', error);
        // Continue with provided translations if AI fails
      }
    }

    // Validate languages
    const languageIds = translations.map((t) => t.languageId);
    const languages = await this.languageRepo().find({
      where: { id: In(languageIds) },
    });

    if (languages.length !== languageIds.length) {
      throw new Error('One or more languages not found');
    }

    // Create blog entity (without title, content, slug - these are in translations)
    const blog = this.repo().create({
      tenantId: input.tenantId,
      locationId: input.locationId === 'general' || input.locationId === '' ? null : input.locationId || null,
      status: input.status || BlogStatus.DRAFT,
      publishedAt: input.publishedAt || (input.status === BlogStatus.PUBLISHED ? new Date() : null),
      image: input.image,
    });

    const savedBlog = await this.repo().save(blog);

    // Create translations
    // No need to get default language again, translations are already prepared

    const translationEntities = translations.map((t) => {
      // Generate slug if not provided
      const translationSlug = t.slug || slugify(t.title);
      
      // Store content, short_description, and slug in value field (name = title)
      // Value format: { content: "...", short_description: "...", slug: "..." }
      const valueData: { content: string; short_description?: string; slug?: string } = { 
        content: t.content,
      };
      if (t.short_description) {
        valueData.short_description = t.short_description;
      }
      if (translationSlug) {
        valueData.slug = translationSlug;
      }
      
      return this.translationRepo().create({
        model: MODEL_NAME,
        modelId: savedBlog.id,
        languageId: t.languageId,
        name: t.title, // Title stored in name field
        value: JSON.stringify(valueData),
      });
    });

    await this.translationRepo().save(translationEntities);

    return this.getById(savedBlog.id) as Promise<BlogWithTranslations>;
  }

  static async update(id: string, input: UpdateBlogDto): Promise<BlogWithTranslations> {
    const blog = await this.repo().findOne({ where: { id } });
    if (!blog) {
      throw new Error('Blog not found');
    }

    // Update non-translation fields
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
    if (input.image !== undefined) {
      blog.image = input.image;
    }

    const savedBlog = await this.repo().save(blog);

    // Handle translations if provided
    if (input.translations !== undefined) {
      // Validate languages
      const languageIds = input.translations.map((t) => t.languageId);
      const languages = await this.languageRepo().find({
        where: { id: In(languageIds) },
      });

      if (languages.length !== languageIds.length) {
        throw new Error('One or more languages not found');
      }

      // Delete existing translations
      await this.translationRepo().delete({
        model: MODEL_NAME,
        modelId: id,
      });

      // Create new translations
      if (input.translations.length > 0) {
        const translationEntities = input.translations.map((t) => {
          // Generate slug if not provided
          const translationSlug = t.slug || slugify(t.title);
          
          // Store content, short_description, and slug in value field (name = title)
          // Value format: { content: "...", short_description: "...", slug: "..." }
          const valueData: { content: string; short_description?: string; slug?: string } = { 
            content: t.content,
          };
          if (t.short_description) {
            valueData.short_description = t.short_description;
          }
          if (translationSlug) {
            valueData.slug = translationSlug;
          }
          
          return this.translationRepo().create({
            model: MODEL_NAME,
            modelId: id,
            languageId: t.languageId,
            name: t.title, // Title stored in name field
            value: JSON.stringify(valueData),
          });
        });

        await this.translationRepo().save(translationEntities);
      }
    }

    return this.getById(id) as Promise<BlogWithTranslations>;
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
