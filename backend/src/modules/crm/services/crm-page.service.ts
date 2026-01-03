import { Repository, In } from 'typeorm';
import { AppDataSource } from '../../../config/data-source';
import { CrmPage } from '../entities/crm-page.entity';
import { CrmPageCategory } from '../entities/crm-page-category.entity';
import { Translation } from '../../shared/entities/translation.entity';
import { CrmPageCategoryService, CrmPageCategoryTranslationInput } from './crm-page-category.service';

export type CrmPageTranslationInput = {
  languageId: string;
  title: string;
  description?: string;
  slug?: string; // Optional slug, will be auto-generated from title if not provided
};

export type CreateCrmPageDto = {
  tenantId: string;
  categoryId?: string; // If provided, use existing category
  categorySlug?: string; // If categoryId not provided, create/get category by slug
  categoryTranslations?: CrmPageCategoryTranslationInput[]; // Required if creating new category
  image?: string;
  isActive?: boolean;
  sortOrder?: number;
  translations: CrmPageTranslationInput[]; // At least one translation required
};

export type UpdateCrmPageDto = {
  categoryId?: string;
  image?: string;
  isActive?: boolean;
  sortOrder?: number;
  translations?: CrmPageTranslationInput[]; // If provided, replaces all translations
};

export type CrmPageWithTranslations = CrmPage & {
  translations?: Translation[];
  category?: CrmPageCategory;
};

const MODEL_NAME = 'CrmPage';

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

export class CrmPageService {
  private static repo(): Repository<CrmPage> {
    return AppDataSource.getRepository(CrmPage);
  }

  private static translationRepo(): Repository<Translation> {
    return AppDataSource.getRepository(Translation);
  }

  private static categoryRepo(): Repository<CrmPageCategory> {
    return AppDataSource.getRepository(CrmPageCategory);
  }

  /**
   * List all pages for a tenant, optionally filtered by category
   */
  static async list(
    tenantId: string,
    languageId?: string,
    categoryId?: string
  ): Promise<CrmPageWithTranslations[]> {
    const query = this.repo()
      .createQueryBuilder('page')
      .leftJoinAndSelect('page.category', 'category')
      .where('page.tenantId = :tenantId', { tenantId })
      .orderBy('page.sortOrder', 'ASC')
      .addOrderBy('page.createdAt', 'DESC');

    if (categoryId) {
      query.andWhere('page.categoryId = :categoryId', { categoryId });
    }

    const pages = await query.getMany();
    const pageIds = pages.map(p => p.id);

    const translationWhere: any = {
      model: MODEL_NAME,
      modelId: In(pageIds),
    };

    if (languageId) {
      translationWhere.languageId = languageId;
    }

    const translations = pageIds.length > 0
      ? await this.translationRepo().find({
          where: translationWhere,
          relations: ['language'],
        })
      : [];

    const translationsByPage = new Map<string, Translation[]>();
    translations.forEach(t => {
      const key = t.modelId;
      if (!translationsByPage.has(key)) {
        translationsByPage.set(key, []);
      }
      translationsByPage.get(key)!.push(t);
    });

    let filteredPages = pages;
    if (languageId) {
      filteredPages = pages.filter(page =>
        translationsByPage.has(page.id)
      );
    }

    return filteredPages.map(page => ({
      ...page,
      translations: translationsByPage.get(page.id) || [],
    }));
  }

  /**
   * Get page by ID with translations
   */
  static async getById(id: string, languageId?: string): Promise<CrmPageWithTranslations | null> {
    const page = await this.repo().findOne({
      where: { id },
      relations: ['category'],
    });

    if (!page) {
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
      ...page,
      translations,
    };
  }

  /**
   * Get page by slug with translations
   */
  static async getBySlug(
    tenantId: string,
    slug: string,
    languageId?: string
  ): Promise<CrmPageWithTranslations | null> {
    const page = await this.repo().findOne({
      where: { tenantId, slug },
      relations: ['category'],
    });

    if (!page) {
      return null;
    }

    return this.getById(page.id, languageId);
  }

  /**
   * Create new page
   */
  static async create(input: CreateCrmPageDto): Promise<CrmPageWithTranslations> {
    if (!input.translations || input.translations.length === 0) {
      throw new Error('At least one translation is required');
    }

    // Resolve category
    let category: CrmPageCategory | null = null;
    if (input.categoryId) {
      category = await this.categoryRepo().findOne({
        where: { id: input.categoryId, tenantId: input.tenantId },
      });

      if (!category) {
        throw new Error('Category not found');
      }
    } else if (input.categorySlug) {
      // Get or create category
      category = await CrmPageCategoryService.getOrCreateBySlug(
        input.tenantId,
        input.categorySlug,
        input.categoryTranslations
      );
    } else {
      throw new Error('Either categoryId or categorySlug is required');
    }

    if (!category) {
      throw new Error('Category is required');
    }

    // Use default language slug as main slug (for backward compatibility)
    const defaultLang = input.translations[0];
    const mainSlug = defaultLang.slug || slugify(defaultLang.title);

    // Check if slug already exists for this tenant
    const existing = await this.repo().findOne({
      where: { tenantId: input.tenantId, slug: mainSlug },
    });

    if (existing) {
      throw new Error(`Page with slug "${mainSlug}" already exists`);
    }

    const page = this.repo().create({
      tenantId: input.tenantId,
      categoryId: category.id,
      slug: mainSlug, // Main slug (default language)
      image: input.image,
      isActive: input.isActive ?? true,
      sortOrder: input.sortOrder ?? 0,
      viewCount: 0,
    });

    const savedPage = await this.repo().save(page);

    // Create translations with slug in value field (JSON format)
    for (const translation of input.translations) {
      const translationSlug = translation.slug || slugify(translation.title);
      
      // Store description and slug in value field as JSON
      const valueData: { description?: string; slug?: string } = {};
      if (translation.description) {
        valueData.description = translation.description;
      }
      if (translationSlug) {
        valueData.slug = translationSlug;
      }
      
      await this.translationRepo().save({
        model: MODEL_NAME,
        modelId: savedPage.id,
        languageId: translation.languageId,
        name: translation.title, // title -> Translation.name
        value: Object.keys(valueData).length > 0 ? JSON.stringify(valueData) : undefined,
      });
    }

    // Increment view count (optional - can be done on page view)
    // await this.incrementViewCount(savedPage.id);

    return this.getById(savedPage.id) as Promise<CrmPageWithTranslations>;
  }

  /**
   * Update page
   */
  static async update(id: string, input: UpdateCrmPageDto): Promise<CrmPageWithTranslations> {
    const page = await this.repo().findOne({ where: { id } });

    if (!page) {
      throw new Error('Page not found');
    }

    if (input.categoryId !== undefined) {
      const category = await this.categoryRepo().findOne({
        where: { id: input.categoryId, tenantId: page.tenantId },
      });

      if (!category) {
        throw new Error('Category not found');
      }

      page.categoryId = input.categoryId;
    }

    if (input.image !== undefined) {
      page.image = input.image;
    }

    if (input.isActive !== undefined) {
      page.isActive = input.isActive;
    }

    if (input.sortOrder !== undefined) {
      page.sortOrder = input.sortOrder;
    }

    // Update main slug if translations provided (use first translation as default)
    if (input.translations && input.translations.length > 0) {
      const defaultTranslation = input.translations[0];
      const newMainSlug = defaultTranslation.slug || slugify(defaultTranslation.title);
      
      // Check if slug already exists for another page
      const existing = await this.repo().findOne({
        where: { tenantId: page.tenantId, slug: newMainSlug },
      });

      if (existing && existing.id !== id) {
        throw new Error(`Page with slug "${newMainSlug}" already exists`);
      }

      page.slug = newMainSlug;
    }

    await this.repo().save(page);

    // Update translations if provided
    if (input.translations) {
      // Delete existing translations
      await this.translationRepo().delete({
        model: MODEL_NAME,
        modelId: id,
      });

      // Create new translations with slug in value field (JSON format)
      for (const translation of input.translations) {
        const translationSlug = translation.slug || slugify(translation.title);
        
        // Store description and slug in value field as JSON
        const valueData: { description?: string; slug?: string } = {};
        if (translation.description) {
          valueData.description = translation.description;
        }
        if (translationSlug) {
          valueData.slug = translationSlug;
        }
        
        await this.translationRepo().save({
          model: MODEL_NAME,
          modelId: id,
          languageId: translation.languageId,
          name: translation.title,
          value: Object.keys(valueData).length > 0 ? JSON.stringify(valueData) : undefined,
        });
      }
    }

    return this.getById(id) as Promise<CrmPageWithTranslations>;
  }

  /**
   * Delete page
   */
  static async delete(id: string): Promise<void> {
    const page = await this.repo().findOne({ where: { id } });

    if (!page) {
      throw new Error('Page not found');
    }

    // Delete translations
    await this.translationRepo().delete({
      model: MODEL_NAME,
      modelId: id,
    });

    // Delete page
    await this.repo().remove(page);
  }

  /**
   * Increment view count
   */
  static async incrementViewCount(id: string): Promise<void> {
    await this.repo().increment({ id }, 'viewCount', 1);
  }
}

