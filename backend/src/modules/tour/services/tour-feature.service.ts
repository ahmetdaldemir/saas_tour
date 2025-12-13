import { In, Repository } from 'typeorm';
import { AppDataSource } from '../../../config/data-source';
import { TourFeature } from '../entities/tour-feature.entity';
import { TourFeatureTranslation } from '../entities/tour-feature-translation.entity';
import { Language } from '../../shared/entities/language.entity';

export type CreateTourFeatureInput = {
  icon: string;
  translations: Array<{
    languageId: string;
    name: string;
  }>;
  sortOrder?: number;
  isActive?: boolean;
};

export type UpdateTourFeatureInput = {
  icon?: string;
  translations?: Array<{
    languageId: string;
    name: string;
  }>;
  sortOrder?: number;
  isActive?: boolean;
};

export type TourFeatureWithTranslations = Omit<TourFeature, 'translations'> & {
  translations: Array<{
    id: string;
    languageId: string;
    languageCode: string;
    name: string;
  }>;
};

export class TourFeatureService {
  private static featureRepo(): Repository<TourFeature> {
    return AppDataSource.getRepository(TourFeature);
  }

  private static translationRepo(): Repository<TourFeatureTranslation> {
    return AppDataSource.getRepository(TourFeatureTranslation);
  }

  private static languageRepo(): Repository<Language> {
    return AppDataSource.getRepository(Language);
  }

  static async list(languageCode?: string): Promise<TourFeatureWithTranslations[]> {
    const features = await this.featureRepo().find({
      relations: ['translations', 'translations.language'],
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });

    return features.map((feature) => ({
      ...feature,
      translations: feature.translations.map((t) => ({
        id: t.id,
        languageId: t.languageId,
        languageCode: t.language.code,
        name: t.name,
      })),
    }));
  }

  static async getById(id: string): Promise<TourFeatureWithTranslations | null> {
    const feature = await this.featureRepo().findOne({
      where: { id },
      relations: ['translations', 'translations.language'],
    });

    if (!feature) {
      return null;
    }

    return {
      ...feature,
      translations: feature.translations.map((t) => ({
        id: t.id,
        languageId: t.languageId,
        languageCode: t.language.code,
        name: t.name,
      })),
    };
  }

  static async create(input: CreateTourFeatureInput): Promise<TourFeatureWithTranslations> {
    // Validate languages exist
    const languageIds = input.translations.map((t) => t.languageId);
    const languages = await this.languageRepo().find({
      where: { id: In(languageIds) },
    });

    if (languages.length !== languageIds.length) {
      throw new Error('One or more languages not found');
    }

    // Create feature
    const feature = this.featureRepo().create({
      icon: input.icon,
      isActive: input.isActive ?? true,
      sortOrder: input.sortOrder ?? 0,
    });

    const savedFeature = await this.featureRepo().save(feature);

    // Create translations
    const translations = input.translations.map((t) =>
      this.translationRepo().create({
        feature: savedFeature,
        featureId: savedFeature.id,
        languageId: t.languageId,
        name: t.name,
      })
    );

    await this.translationRepo().save(translations);

    return this.getById(savedFeature.id) as Promise<TourFeatureWithTranslations>;
  }

  static async update(id: string, input: UpdateTourFeatureInput): Promise<TourFeatureWithTranslations> {
    const feature = await this.featureRepo().findOne({ where: { id } });
    if (!feature) {
      throw new Error('Tour feature not found');
    }

    // Update feature fields
    if (input.icon !== undefined) {
      feature.icon = input.icon;
    }
    if (input.isActive !== undefined) {
      feature.isActive = input.isActive;
    }
    if (input.sortOrder !== undefined) {
      feature.sortOrder = input.sortOrder;
    }

    await this.featureRepo().save(feature);

    // Update translations if provided
    if (input.translations) {
      // Validate languages
      const languageIds = input.translations.map((t) => t.languageId);
      const languages = await this.languageRepo().find({
        where: { id: In(languageIds) },
      });

      if (languages.length !== languageIds.length) {
        throw new Error('One or more languages not found');
      }

      // Delete existing translations
      await this.translationRepo().delete({ featureId: id });

      // Create new translations
      const translations = input.translations.map((t) =>
        this.translationRepo().create({
          feature: feature,
          featureId: id,
          languageId: t.languageId,
          name: t.name,
        })
      );

      await this.translationRepo().save(translations);
    }

    return this.getById(id) as Promise<TourFeatureWithTranslations>;
  }

  static async remove(id: string): Promise<void> {
    const feature = await this.featureRepo().findOne({ where: { id } });
    if (!feature) {
      throw new Error('Tour feature not found');
    }

    await this.featureRepo().remove(feature);
  }
}

