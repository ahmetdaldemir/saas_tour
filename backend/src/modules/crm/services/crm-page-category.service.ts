import { Repository, In } from 'typeorm';
import { AppDataSource } from '../../../config/data-source';
import { CrmPageCategory } from '../entities/crm-page-category.entity';
import { Translation } from '../../shared/entities/translation.entity';
import { Language } from '../../shared/entities/language.entity';

export type CrmPageCategoryTranslationInput = {
  languageId: string;
  name: string; // Category name/title
};

export type CreateCrmPageCategoryDto = {
  tenantId: string;
  slug: string;
  isActive?: boolean;
  sortOrder?: number;
  translations: CrmPageCategoryTranslationInput[]; // At least one translation required
};

export type UpdateCrmPageCategoryDto = {
  slug?: string;
  isActive?: boolean;
  sortOrder?: number;
  translations?: CrmPageCategoryTranslationInput[]; // If provided, replaces all translations
};

export type CrmPageCategoryWithTranslations = CrmPageCategory & {
  translations?: Translation[];
};

const MODEL_NAME = 'CrmPageCategory';

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

export class CrmPageCategoryService {
  private static repo(): Repository<CrmPageCategory> {
    return AppDataSource.getRepository(CrmPageCategory);
  }

  private static translationRepo(): Repository<Translation> {
    return AppDataSource.getRepository(Translation);
  }

  /**
   * List all categories for a tenant with translations
   */
  static async list(tenantId: string, languageId?: string): Promise<CrmPageCategoryWithTranslations[]> {
    const categories = await this.repo().find({
      where: { tenantId },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });

    const categoryIds = categories.map(c => c.id);

    const translationWhere: any = {
      model: MODEL_NAME,
      modelId: In(categoryIds),
    };

    if (languageId) {
      translationWhere.languageId = languageId;
    }

    const translations = categoryIds.length > 0
      ? await this.translationRepo().find({
          where: translationWhere,
          relations: ['language'],
        })
      : [];

    const translationsByCategory = new Map<string, Translation[]>();
    translations.forEach(t => {
      const key = t.modelId;
      if (!translationsByCategory.has(key)) {
        translationsByCategory.set(key, []);
      }
      translationsByCategory.get(key)!.push(t);
    });

    let filteredCategories = categories;
    if (languageId) {
      filteredCategories = categories.filter(cat =>
        translationsByCategory.has(cat.id)
      );
    }

    return filteredCategories.map(category => ({
      ...category,
      translations: translationsByCategory.get(category.id) || [],
    }));
  }

  /**
   * Get category by ID with translations
   */
  static async getById(id: string, languageId?: string): Promise<CrmPageCategoryWithTranslations | null> {
    const category = await this.repo().findOne({
      where: { id },
    });

    if (!category) {
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
      ...category,
      translations,
    };
  }

  /**
   * Get or create category by slug
   * Used when creating pages - if category doesn't exist, create it
   */
  static async getOrCreateBySlug(
    tenantId: string,
    slug: string,
    translations?: CrmPageCategoryTranslationInput[]
  ): Promise<CrmPageCategory> {
    let category = await this.repo().findOne({
      where: { tenantId, slug },
    });

    if (!category) {
      // Create category if it doesn't exist
      if (!translations || translations.length === 0) {
        throw new Error('Translations are required when creating a new category');
      }

      category = this.repo().create({
        tenantId,
        slug,
        isActive: true,
        sortOrder: 0,
      });

      category = await this.repo().save(category);

      // Create translations
      for (const translation of translations) {
        await this.translationRepo().save({
          model: MODEL_NAME,
          modelId: category.id,
          languageId: translation.languageId,
          name: translation.name,
        });
      }
    }

    return category;
  }

  /**
   * Create new category
   */
  static async create(input: CreateCrmPageCategoryDto): Promise<CrmPageCategoryWithTranslations> {
    if (!input.translations || input.translations.length === 0) {
      throw new Error('At least one translation is required');
    }

    const slug = input.slug || slugify(input.translations[0].name);

    // Check if slug already exists for this tenant
    const existing = await this.repo().findOne({
      where: { tenantId: input.tenantId, slug },
    });

    if (existing) {
      throw new Error(`Category with slug "${slug}" already exists`);
    }

    const category = this.repo().create({
      tenantId: input.tenantId,
      slug,
      isActive: input.isActive ?? true,
      sortOrder: input.sortOrder ?? 0,
    });

    const savedCategory = await this.repo().save(category);

    // Create translations
    for (const translation of input.translations) {
      await this.translationRepo().save({
        model: MODEL_NAME,
        modelId: savedCategory.id,
        languageId: translation.languageId,
        name: translation.name,
      });
    }

    return this.getById(savedCategory.id) as Promise<CrmPageCategoryWithTranslations>;
  }

  /**
   * Update category
   */
  static async update(id: string, input: UpdateCrmPageCategoryDto): Promise<CrmPageCategoryWithTranslations> {
    const category = await this.repo().findOne({ where: { id } });

    if (!category) {
      throw new Error('Category not found');
    }

    if (input.slug !== undefined) {
      const slug = input.slug || slugify(input.translations?.[0]?.name || category.slug);
      
      // Check if slug already exists for another category
      const existing = await this.repo().findOne({
        where: { tenantId: category.tenantId, slug },
      });

      if (existing && existing.id !== id) {
        throw new Error(`Category with slug "${slug}" already exists`);
      }

      category.slug = slug;
    }

    if (input.isActive !== undefined) {
      category.isActive = input.isActive;
    }

    if (input.sortOrder !== undefined) {
      category.sortOrder = input.sortOrder;
    }

    await this.repo().save(category);

    // Update translations if provided
    if (input.translations) {
      // Delete existing translations
      await this.translationRepo().delete({
        model: MODEL_NAME,
        modelId: id,
      });

      // Create new translations
      for (const translation of input.translations) {
        await this.translationRepo().save({
          model: MODEL_NAME,
          modelId: id,
          languageId: translation.languageId,
          name: translation.name,
        });
      }
    }

    return this.getById(id) as Promise<CrmPageCategoryWithTranslations>;
  }

  /**
   * Delete category
   */
  static async delete(id: string): Promise<void> {
    const category = await this.repo().findOne({
      where: { id },
      relations: ['pages'],
    });

    if (!category) {
      throw new Error('Category not found');
    }

    if (category.pages && category.pages.length > 0) {
      throw new Error('Cannot delete category with existing pages');
    }

    // Delete translations
    await this.translationRepo().delete({
      model: MODEL_NAME,
      modelId: id,
    });

    // Delete category
    await this.repo().remove(category);
  }
}

