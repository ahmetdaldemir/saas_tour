import { Repository, In } from 'typeorm';
import { AppDataSource } from '../../../config/data-source';
import { CrmPageCategory } from '../entities/crm-page-category.entity';
import { Translation } from '../../shared/entities/translation.entity';
import { Language } from '../../shared/entities/language.entity';

export type CrmPageCategoryTranslationInput = {
  languageId: string;
  name: string; // Category name/title
  slug?: string; // Optional slug, will be auto-generated from name if not provided
};

export type CreateCrmPageCategoryDto = {
  tenantId: string;
  isActive?: boolean;
  sortOrder?: number;
  translations: CrmPageCategoryTranslationInput[]; // At least one translation required
};

export type UpdateCrmPageCategoryDto = {
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
    // Try to find by main slug first
    let category = await this.repo().findOne({
      where: { tenantId, slug },
    });

    // If not found and languageId provided, search in translations
    if (!category && translations && translations.length > 0) {
      const allCategories = await this.repo().find({ where: { tenantId } });
      const categoryIds = allCategories.map(c => c.id);
      
      if (categoryIds.length > 0) {
        const allTranslations = await this.translationRepo().find({
          where: {
            model: MODEL_NAME,
            modelId: In(categoryIds),
          },
        });

        // Search for slug in translation value (JSON)
        for (const translation of allTranslations) {
          if (translation.value) {
            try {
              const valueData = JSON.parse(translation.value);
              if (valueData.slug === slug) {
                const foundCategory = allCategories.find(c => c.id === translation.modelId);
                if (foundCategory) {
                  category = foundCategory;
                  break;
                }
              }
            } catch {
              // Not JSON, skip
            }
          }
        }
      }
    }

    if (!category) {
      // Create category if it doesn't exist
      if (!translations || translations.length === 0) {
        throw new Error('Translations are required when creating a new category');
      }

      // Use first translation's slug as main slug
      const defaultTranslation = translations[0];
      const mainSlug = defaultTranslation.slug || slugify(defaultTranslation.name);

      category = this.repo().create({
        tenantId,
        slug: mainSlug,
        isActive: true,
        sortOrder: 0,
      });

      category = await this.repo().save(category);

      // Create translations with slug in value field (JSON format)
      for (const translation of translations) {
        const translationSlug = translation.slug || slugify(translation.name);
        
        // Store slug in value field as JSON
        const valueData: { slug?: string } = {};
        if (translationSlug) {
          valueData.slug = translationSlug;
        }
        
        await this.translationRepo().save({
          model: MODEL_NAME,
          modelId: category.id,
          languageId: translation.languageId,
          name: translation.name,
          value: Object.keys(valueData).length > 0 ? JSON.stringify(valueData) : undefined,
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

    // Use first translation's slug as main slug (for backward compatibility)
    const defaultTranslation = input.translations[0];
    const mainSlug = defaultTranslation.slug || slugify(defaultTranslation.name);

    // Check if slug already exists for this tenant
    const existing = await this.repo().findOne({
      where: { tenantId: input.tenantId, slug: mainSlug },
    });

    if (existing) {
      throw new Error(`Category with slug "${mainSlug}" already exists`);
    }

    const category = this.repo().create({
      tenantId: input.tenantId,
      slug: mainSlug,
      isActive: input.isActive ?? true,
      sortOrder: input.sortOrder ?? 0,
    });

    const savedCategory = await this.repo().save(category);

    // Create translations with slug in value field (JSON format)
    for (const translation of input.translations) {
      const translationSlug = translation.slug || slugify(translation.name);
      
      // Store slug in value field as JSON
      const valueData: { slug?: string } = {};
      if (translationSlug) {
        valueData.slug = translationSlug;
      }
      
      await this.translationRepo().save({
        model: MODEL_NAME,
        modelId: savedCategory.id,
        languageId: translation.languageId,
        name: translation.name,
        value: Object.keys(valueData).length > 0 ? JSON.stringify(valueData) : undefined,
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

    if (input.isActive !== undefined) {
      category.isActive = input.isActive;
    }

    if (input.sortOrder !== undefined) {
      category.sortOrder = input.sortOrder;
    }

    // Update main slug if translations provided (use first translation as default)
    if (input.translations && input.translations.length > 0) {
      const defaultTranslation = input.translations[0];
      const newMainSlug = defaultTranslation.slug || slugify(defaultTranslation.name);
      
      // Check if slug already exists for another category
      const existing = await this.repo().findOne({
        where: { tenantId: category.tenantId, slug: newMainSlug },
      });

      if (existing && existing.id !== id) {
        throw new Error(`Category with slug "${newMainSlug}" already exists`);
      }

      category.slug = newMainSlug;
    }

    await this.repo().save(category);

    // Update translations if provided
    if (input.translations) {
      // Delete existing translations
      await this.translationRepo().delete({
        model: MODEL_NAME,
        modelId: id,
      });

      // Create new translations with slug in value field (JSON format)
      for (const translation of input.translations) {
        const translationSlug = translation.slug || slugify(translation.name);
        
        // Store slug in value field as JSON
        const valueData: { slug?: string } = {};
        if (translationSlug) {
          valueData.slug = translationSlug;
        }
        
        await this.translationRepo().save({
          model: MODEL_NAME,
          modelId: id,
          languageId: translation.languageId,
          name: translation.name,
          value: Object.keys(valueData).length > 0 ? JSON.stringify(valueData) : undefined,
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

