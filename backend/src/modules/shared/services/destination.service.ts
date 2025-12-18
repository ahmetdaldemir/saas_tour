import { Repository, In } from 'typeorm';
import { AppDataSource } from '../../../config/data-source';
import { Destination } from '../entities/destination.entity';
import { Translation } from '../entities/translation.entity';
import { Language } from '../entities/language.entity';

export type DestinationTranslationInput = {
  languageId: string;
  title: string;
  description?: string;
  shortDescription?: string;
};

export type CreateDestinationDto = {
  image?: string;
  isFeatured?: boolean;
  translations: DestinationTranslationInput[];
};

export type UpdateDestinationDto = {
  image?: string;
  isFeatured?: boolean;
  translations?: DestinationTranslationInput[];
};

export type DestinationWithTranslations = Destination & {
  translations?: Translation[];
};

const MODEL_NAME = 'Destination';

export class DestinationService {
  private static repo(): Repository<Destination> {
    return AppDataSource.getRepository(Destination);
  }

  private static translationRepo(): Repository<Translation> {
    return AppDataSource.getRepository(Translation);
  }

  static async list(): Promise<DestinationWithTranslations[]> {
    const destinations = await this.repo().find({
      order: { createdAt: 'DESC' },
    });

    // Fetch translations for all destinations
    const destinationIds = destinations.map(d => d.id);
    const translations = destinationIds.length > 0
      ? await this.translationRepo().find({
          where: {
            model: MODEL_NAME,
            modelId: In(destinationIds),
          },
          relations: ['language'],
        })
      : [];

    // Group translations by destination
    const translationsByDestination = new Map<string, Translation[]>();
    translations.forEach(t => {
      const key = t.modelId;
      if (!translationsByDestination.has(key)) {
        translationsByDestination.set(key, []);
      }
      translationsByDestination.get(key)!.push(t);
    });

    // Combine destinations with translations
    return destinations.map(dest => ({
      ...dest,
      translations: translationsByDestination.get(dest.id) || [],
    }));
  }

  static async getById(id: string): Promise<DestinationWithTranslations | null> {
    const destination = await this.repo().findOne({ where: { id } });
    if (!destination) {
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
      ...destination,
      translations,
    };
  }

  static async create(input: CreateDestinationDto): Promise<DestinationWithTranslations> {
    // Validate translations
    if (!input.translations || input.translations.length === 0) {
      throw new Error('At least one translation is required');
    }

    // Validate languages
    const languageIds = input.translations.map((t) => t.languageId);
    const languageRepo = AppDataSource.getRepository(Language);
    const languages = await languageRepo.find({
      where: { id: In(languageIds) },
    });

    if (languages.length !== languageIds.length) {
      throw new Error('One or more languages not found');
    }

    // Create destination
    const destination = this.repo().create({
      image: input.image,
      isFeatured: input.isFeatured ?? false,
    });

    const savedDestination = await this.repo().save(destination);

    // Create translations
    const translations = input.translations.map((t) =>
      this.translationRepo().create({
        model: MODEL_NAME,
        modelId: savedDestination.id,
        languageId: t.languageId,
        name: t.title,
        description: t.description || t.shortDescription,
      })
    );

    await this.translationRepo().save(translations);

    return this.getById(savedDestination.id) as Promise<DestinationWithTranslations>;
  }

  static async update(id: string, input: UpdateDestinationDto): Promise<DestinationWithTranslations> {
    const destination = await this.repo().findOne({ where: { id } });
    if (!destination) {
      throw new Error('Destination not found');
    }

    // Update image if provided
    if (input.image !== undefined) {
      destination.image = input.image;
    }

    // Update isFeatured if provided
    if (input.isFeatured !== undefined) {
      destination.isFeatured = input.isFeatured;
    }

    await this.repo().save(destination);

    // Update translations if provided
    if (input.translations !== undefined) {
      // Validate languages
      const languageIds = input.translations.map((t) => t.languageId);
      const languageRepo = AppDataSource.getRepository(Language);
      const languages = await languageRepo.find({
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
      const translations = input.translations.map((t) =>
        this.translationRepo().create({
          model: MODEL_NAME,
          modelId: id,
          languageId: t.languageId,
          name: t.title,
          description: t.description || t.shortDescription,
        })
      );

      await this.translationRepo().save(translations);
    }

    return this.getById(id) as Promise<DestinationWithTranslations>;
  }

  static async remove(id: string): Promise<void> {
    const destination = await this.repo().findOne({ where: { id } });
    if (!destination) {
      throw new Error('Destination not found');
    }
    
    // Delete translations first (cascade should handle this, but being explicit)
    await this.translationRepo().delete({
      model: MODEL_NAME,
      modelId: id,
    });
    
    await this.repo().remove(destination);
  }
}
