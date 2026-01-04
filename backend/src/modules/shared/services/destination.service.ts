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
  slug?: string; // Optional, will be auto-generated if not provided
};

export type CreateDestinationDto = {
  tenantId: string;
  image?: string;
  isFeatured?: boolean;
  isActive?: boolean;
  translations: DestinationTranslationInput[];
};

export type UpdateDestinationDto = {
  image?: string;
  isFeatured?: boolean;
  isActive?: boolean;
  translations?: DestinationTranslationInput[];
};

export type DestinationWithTranslations = Destination & {
  translations?: Translation[];
};

const MODEL_NAME = 'Destination';

// Helper function to create slug from title (with Turkish character support)
function slugify(text: string): string {
  if (!text) return '';
  
  // Turkish character mappings
  const turkishMap: { [key: string]: string } = {
    'ç': 'c', 'Ç': 'c',
    'ğ': 'g', 'Ğ': 'g',
    'ı': 'i', 'İ': 'i',
    'ö': 'o', 'Ö': 'o',
    'ş': 's', 'Ş': 's',
    'ü': 'u', 'Ü': 'u',
  };
  
  return text
    .toString()
    .split('')
    .map(char => turkishMap[char] || char)
    .join('')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
}

export class DestinationService {
  private static repo(): Repository<Destination> {
    return AppDataSource.getRepository(Destination);
  }

  private static translationRepo(): Repository<Translation> {
    return AppDataSource.getRepository(Translation);
  }

  static async list(tenantId: string, languageId?: string): Promise<DestinationWithTranslations[]> {
    // Always filter by tenantId
    const destinations = await this.repo().find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });

    // Fetch translations for all destinations
    const destinationIds = destinations.map(d => d.id);
    
    // Build translation query
    const translationWhere: any = {
      model: MODEL_NAME,
      modelId: In(destinationIds),
    };
    
    // If languageId provided (API request), filter by languageId
    // If languageId not provided (Panel request), get all translations
    if (languageId) {
      translationWhere.languageId = languageId;
    }
    
    const translations = destinationIds.length > 0
      ? await this.translationRepo().find({
          where: translationWhere,
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
    // If languageId provided (API request), only return destinations that have translation in that language
    // If languageId not provided (Panel request), return all destinations with all their translations
    let filteredDestinations = destinations;
    if (languageId) {
      filteredDestinations = destinations.filter(dest => 
        translationsByDestination.has(dest.id)
      );
    }

    return filteredDestinations.map(dest => ({
      ...dest,
      translations: translationsByDestination.get(dest.id) || [],
    }));
  }

  static async getById(id: string, languageId?: string): Promise<DestinationWithTranslations | null> {
    const destination = await this.repo().findOne({ where: { id } });
    if (!destination) {
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
      ...destination,
      translations,
    };
  }

  static async create(input: CreateDestinationDto): Promise<DestinationWithTranslations> {
    // Validate translations
    if (!input.translations || input.translations.length === 0) {
      throw new Error('At least one translation is required');
    }

    if (!input.tenantId) {
      throw new Error('tenantId is required');
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
      tenantId: input.tenantId,
      image: input.image,
      isFeatured: input.isFeatured ?? false,
      isActive: input.isActive ?? true,
    });

    const savedDestination = await this.repo().save(destination);

    // Create translations
    const translations = input.translations.map((t) => {
      // Store description and shortDescription as JSON in value field
      const valueData: any = {};
      if (t.description) valueData.description = t.description;
      if (t.shortDescription) valueData.shortDescription = t.shortDescription;
      
      // Generate slug from title if not provided
      const slug = t.slug || slugify(t.title);
      
      return this.translationRepo().create({
        model: MODEL_NAME,
        modelId: savedDestination.id,
        languageId: t.languageId,
        name: t.title,
        slug: slug,
        value: Object.keys(valueData).length > 0 ? JSON.stringify(valueData) : undefined,
      });
    });

    await this.translationRepo().save(translations);

    return this.getById(savedDestination.id, undefined) as Promise<DestinationWithTranslations>;
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

    // Update isActive if provided
    if (input.isActive !== undefined) {
      destination.isActive = input.isActive;
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
      const translations = input.translations.map((t) => {
        // Store description and shortDescription as JSON in value field
        const valueData: any = {};
        if (t.description) valueData.description = t.description;
        if (t.shortDescription) valueData.shortDescription = t.shortDescription;
        
        // Generate slug from title if not provided
        const slug = t.slug || slugify(t.title);
        
        return this.translationRepo().create({
          model: MODEL_NAME,
          modelId: id,
          languageId: t.languageId,
          name: t.title,
          slug: slug,
          value: Object.keys(valueData).length > 0 ? JSON.stringify(valueData) : undefined,
        });
      });

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
