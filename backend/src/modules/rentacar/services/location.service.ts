import { Repository } from 'typeorm';
import { AppDataSource } from '../../../config/data-source';
import { Location, LocationType } from '../entities/location.entity';
import { LocationTranslation } from '../entities/location-translation.entity';
import { Language } from '../../shared/entities/language.entity';
import { TranslationService } from '../../shared/services/translation.service';

export type CreateLocationInput = {
  tenantId: string;
  translations: Array<{
    languageId: string;
    name: string;
    metaTitle?: string;
  }>;
  province?: string;
  district?: string;
  parentRegion?: string;
  type?: LocationType;
  orderNo?: number;
  deliveryFee?: number;
  dropFee?: number;
  minDayCount?: number;
  currencyCode?: string;
  isActive?: boolean;
};

export type UpdateLocationInput = Partial<CreateLocationInput>;

export type LocationWithTranslations = Omit<Location, 'translations' | 'tenant'> & {
  translations: Array<{
    id: string;
    languageId: string;
    languageCode: string;
    name: string;
    metaTitle?: string;
  }>;
};

export class LocationService {
  private static locationRepo(): Repository<Location> {
    return AppDataSource.getRepository(Location);
  }

  private static translationRepo(): Repository<LocationTranslation> {
    return AppDataSource.getRepository(LocationTranslation);
  }

  private static languageRepo(): Repository<Language> {
    return AppDataSource.getRepository(Language);
  }

  static async list(tenantId: string): Promise<LocationWithTranslations[]> {
    const locations = await this.locationRepo().find({
      where: { tenantId },
      relations: ['translations', 'translations.language'],
      order: { orderNo: 'ASC', createdAt: 'DESC' },
    });

    return locations.map((location) => ({
      id: location.id,
      createdAt: location.createdAt,
      updatedAt: location.updatedAt,
      tenantId: location.tenantId,
      province: location.province,
      district: location.district,
      parentRegion: location.parentRegion,
      type: location.type,
      orderNo: location.orderNo,
      deliveryFee: location.deliveryFee,
      dropFee: location.dropFee,
      minDayCount: location.minDayCount,
      currencyCode: location.currencyCode,
      isActive: location.isActive,
      translations: location.translations.map((t) => ({
        id: t.id,
        languageId: t.languageId,
        languageCode: t.language.code,
        name: t.name,
        metaTitle: t.metaTitle,
      })),
    }));
  }

  static async create(input: CreateLocationInput): Promise<LocationWithTranslations> {
    const {
      tenantId,
      translations: inputTranslations,
      province,
      district,
      parentRegion,
      type,
      orderNo,
      deliveryFee,
      dropFee,
      minDayCount,
      currencyCode,
      isActive,
    } = input;

    if (!inputTranslations || inputTranslations.length === 0) {
      throw new Error('At least one translation is required');
    }

    // Build parent region from province and district
    const finalParentRegion = parentRegion || (district ? `${province} - ${district}` : province);

    const location = this.locationRepo().create({
      tenantId,
      province,
      district,
      parentRegion: finalParentRegion,
      type: type || LocationType.MERKEZ,
      orderNo: orderNo || 1000,
      deliveryFee: deliveryFee || 0,
      dropFee: dropFee || 0,
      minDayCount,
      currencyCode: currencyCode || 'TRY',
      isActive: isActive !== undefined ? isActive : true,
    });

    const savedLocation = await this.locationRepo().save(location);

    // Get default language
    const defaultLanguage = await this.languageRepo().findOne({ where: { isDefault: true } });
    const defaultTranslation = inputTranslations.find(
      (t) => defaultLanguage && t.languageId === defaultLanguage.id
    ) || inputTranslations[0];

    // Auto-translate for other languages if default language is provided
    const translationEntities = await Promise.all(
      inputTranslations.map(async (t) => {
        const language = await this.languageRepo().findOne({ where: { id: t.languageId } });
        if (!language) {
          throw new Error(`Language with ID ${t.languageId} not found`);
        }

        let name = t.name;
        let metaTitle = t.metaTitle;

        // Auto-translate if this is not the default language and default translation exists
        if (defaultLanguage && t.languageId !== defaultLanguage.id && defaultTranslation.name) {
          try {
            name = await TranslationService.translateText({
              text: defaultTranslation.name,
              targetLanguageCode: language.code,
              sourceLanguageCode: defaultLanguage.code,
            });
          } catch (error) {
            console.error('Auto-translation failed for name, using provided name:', error);
          }

          if (defaultTranslation.metaTitle) {
            try {
              metaTitle = await TranslationService.translateText({
                text: defaultTranslation.metaTitle,
                targetLanguageCode: language.code,
                sourceLanguageCode: defaultLanguage.code,
              });
            } catch (error) {
              console.error('Auto-translation failed for metaTitle, using provided metaTitle:', error);
            }
          }
        }

        return this.translationRepo().create({
          location: savedLocation,
          language,
          name,
          metaTitle,
        });
      })
    );

    await this.translationRepo().save(translationEntities);

    return this.getById(savedLocation.id) as Promise<LocationWithTranslations>;
  }

  static async getById(id: string): Promise<LocationWithTranslations | null> {
    const location = await this.locationRepo().findOne({
      where: { id },
      relations: ['translations', 'translations.language'],
    });

    if (!location) {
      return null;
    }

    return {
      id: location.id,
      createdAt: location.createdAt,
      updatedAt: location.updatedAt,
      tenantId: location.tenantId,
      province: location.province,
      district: location.district,
      parentRegion: location.parentRegion,
      type: location.type,
      orderNo: location.orderNo,
      deliveryFee: location.deliveryFee,
      dropFee: location.dropFee,
      minDayCount: location.minDayCount,
      currencyCode: location.currencyCode,
      isActive: location.isActive,
      translations: location.translations.map((t) => ({
        id: t.id,
        languageId: t.languageId,
        languageCode: t.language.code,
        name: t.name,
        metaTitle: t.metaTitle,
      })),
    };
  }

  static async update(id: string, input: UpdateLocationInput): Promise<LocationWithTranslations> {
    const location = await this.locationRepo().findOne({ where: { id } });
    if (!location) {
      throw new Error('Location not found');
    }

    if (input.province !== undefined) location.province = input.province;
    if (input.district !== undefined) location.district = input.district;
    if (input.type !== undefined) location.type = input.type;
    if (input.orderNo !== undefined) location.orderNo = input.orderNo;
    if (input.deliveryFee !== undefined) location.deliveryFee = input.deliveryFee;
    if (input.dropFee !== undefined) location.dropFee = input.dropFee;
    if (input.minDayCount !== undefined) location.minDayCount = input.minDayCount;
    if (input.currencyCode !== undefined) location.currencyCode = input.currencyCode;
    if (input.isActive !== undefined) location.isActive = input.isActive;

    // Build parent region from province and district
    if (input.province !== undefined || input.district !== undefined) {
      const finalProvince = input.province !== undefined ? input.province : location.province;
      const finalDistrict = input.district !== undefined ? input.district : location.district;
      location.parentRegion = input.parentRegion || (finalDistrict ? `${finalProvince} - ${finalDistrict}` : finalProvince);
    } else if (input.parentRegion !== undefined) {
      location.parentRegion = input.parentRegion;
    }

    const savedLocation = await this.locationRepo().save(location);

    if (input.translations !== undefined) {
      await this.translationRepo().delete({ locationId: id });

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

          let name = t.name;
          let metaTitle = t.metaTitle;

          if (defaultLanguage && t.languageId !== defaultLanguage.id && defaultTranslation.name) {
            try {
              name = await TranslationService.translateText({
                text: defaultTranslation.name,
                targetLanguageCode: language.code,
                sourceLanguageCode: defaultLanguage.code,
              });
            } catch (error) {
              console.error('Auto-translation failed for name, using provided name:', error);
            }

            if (defaultTranslation.metaTitle) {
              try {
                metaTitle = await TranslationService.translateText({
                  text: defaultTranslation.metaTitle,
                  targetLanguageCode: language.code,
                  sourceLanguageCode: defaultLanguage.code,
                });
              } catch (error) {
                console.error('Auto-translation failed for metaTitle, using provided metaTitle:', error);
              }
            }
          }

          return this.translationRepo().create({
            location: savedLocation,
            language,
            name,
            metaTitle,
          });
        })
      );
      await this.translationRepo().save(translationEntities);
    }

    return this.getById(savedLocation.id) as Promise<LocationWithTranslations>;
  }

  static async remove(id: string): Promise<void> {
    const location = await this.locationRepo().findOne({ where: { id } });
    if (!location) {
      throw new Error('Location not found');
    }
    await this.locationRepo().remove(location);
  }
}

