import { Repository } from 'typeorm';
import { AppDataSource } from '../../../config/data-source';
import { VehicleCategory } from '../entities/vehicle-category.entity';
import { VehicleCategoryTranslation } from '../entities/vehicle-category-translation.entity';
import { Language } from '../../shared/entities/language.entity';
import { TranslationService } from '../../shared/services/translation.service';

export type CreateVehicleCategoryInput = {
  translations: Array<{
    languageId: string;
    name: string;
  }>;
  sortOrder?: number;
  isActive?: boolean;
};

export type UpdateVehicleCategoryInput = Partial<CreateVehicleCategoryInput>;

export type VehicleCategoryWithTranslations = Omit<VehicleCategory, 'translations'> & {
  translations: Array<{
    id: string;
    languageId: string;
    languageCode: string;
    name: string;
  }>;
};

export class VehicleCategoryService {
  private static categoryRepo(): Repository<VehicleCategory> {
    return AppDataSource.getRepository(VehicleCategory);
  }

  private static translationRepo(): Repository<VehicleCategoryTranslation> {
    return AppDataSource.getRepository(VehicleCategoryTranslation);
  }

  private static languageRepo(): Repository<Language> {
    return AppDataSource.getRepository(Language);
  }

  static async list(): Promise<VehicleCategoryWithTranslations[]> {
    const categories = await this.categoryRepo().find({
      relations: ['translations', 'translations.language'],
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });

    return categories.map((category) => ({
      ...category,
      translations: category.translations.map((t) => ({
        id: t.id,
        languageId: t.languageId,
        languageCode: t.language.code,
        name: t.name,
      })),
    }));
  }

  static async create(input: CreateVehicleCategoryInput): Promise<VehicleCategoryWithTranslations> {
    const { translations: inputTranslations, sortOrder, isActive } = input;

    if (!inputTranslations || inputTranslations.length === 0) {
      throw new Error('At least one translation is required');
    }

    const category = this.categoryRepo().create({
      sortOrder,
      isActive,
    });

    const savedCategory = await this.categoryRepo().save(category);

    // Get default language
    const defaultLanguage = await this.languageRepo().findOne({ where: { isDefault: true } });
    const defaultTranslation = inputTranslations.find(t => 
      defaultLanguage && t.languageId === defaultLanguage.id
    ) || inputTranslations[0];

    // Auto-translate for other languages if default language is provided
    const translationEntities = await Promise.all(
      inputTranslations.map(async (t) => {
        const language = await this.languageRepo().findOne({ where: { id: t.languageId } });
        if (!language) {
          throw new Error(`Language with ID ${t.languageId} not found`);
        }

        let name = t.name;
        
        // Auto-translate if this is not the default language and default translation exists
        if (defaultLanguage && t.languageId !== defaultLanguage.id && defaultTranslation.name) {
          try {
            name = await TranslationService.translateText({
              text: defaultTranslation.name,
              targetLanguageCode: language.code,
              sourceLanguageCode: defaultLanguage.code,
            });
          } catch (error) {
            console.error('Auto-translation failed, using provided name:', error);
          }
        }

        return this.translationRepo().create({
          category: savedCategory,
          language,
          name,
        });
      })
    );

    await this.translationRepo().save(translationEntities);

    return this.getById(savedCategory.id) as Promise<VehicleCategoryWithTranslations>;
  }

  static async getById(id: string): Promise<VehicleCategoryWithTranslations | null> {
    const category = await this.categoryRepo().findOne({
      where: { id },
      relations: ['translations', 'translations.language'],
    });

    if (!category) {
      return null;
    }

    return {
      ...category,
      translations: category.translations.map((t) => ({
        id: t.id,
        languageId: t.languageId,
        languageCode: t.language.code,
        name: t.name,
      })),
    };
  }

  static async update(id: string, input: UpdateVehicleCategoryInput): Promise<VehicleCategoryWithTranslations> {
    const category = await this.categoryRepo().findOne({ where: { id } });
    if (!category) {
      throw new Error('Vehicle category not found');
    }

    if (input.sortOrder !== undefined) category.sortOrder = input.sortOrder;
    if (input.isActive !== undefined) category.isActive = input.isActive;

    const savedCategory = await this.categoryRepo().save(category);

    if (input.translations !== undefined) {
      await this.translationRepo().delete({ categoryId: id });

      const defaultLanguage = await this.languageRepo().findOne({ where: { isDefault: true } });
      const defaultTranslation = input.translations.find(t => 
        defaultLanguage && t.languageId === defaultLanguage.id
      ) || input.translations[0];

      const translationEntities = await Promise.all(
        input.translations.map(async (t) => {
          const language = await this.languageRepo().findOne({ where: { id: t.languageId } });
          if (!language) {
            throw new Error(`Language with ID ${t.languageId} not found`);
          }

          let name = t.name;
          
          if (defaultLanguage && t.languageId !== defaultLanguage.id && defaultTranslation.name) {
            try {
              name = await TranslationService.translateText({
                text: defaultTranslation.name,
                targetLanguageCode: language.code,
                sourceLanguageCode: defaultLanguage.code,
              });
            } catch (error) {
              console.error('Auto-translation failed, using provided name:', error);
            }
          }

          return this.translationRepo().create({
            category: savedCategory,
            language,
            name,
          });
        })
      );
      await this.translationRepo().save(translationEntities);
    }

    return this.getById(savedCategory.id) as Promise<VehicleCategoryWithTranslations>;
  }

  static async remove(id: string): Promise<void> {
    const category = await this.categoryRepo().findOne({ where: { id } });
    if (!category) {
      throw new Error('Vehicle category not found');
    }
    await this.categoryRepo().remove(category);
  }
}

