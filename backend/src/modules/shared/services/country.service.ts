import { Repository } from 'typeorm';
import { AppDataSource } from '../../../config/data-source';
import { Country } from '../entities/country.entity';
import axios from 'axios';

export type CreateCountryInput = {
  name: string;
  code: string;
  phoneCode: string;
  flag?: string;
  isActive?: boolean;
};

export type UpdateCountryInput = {
  name?: string;
  code?: string;
  phoneCode?: string;
  flag?: string;
  isActive?: boolean;
};

export class CountryService {
  private static repository(): Repository<Country> {
    return AppDataSource.getRepository(Country);
  }

  static async list(): Promise<Country[]> {
    return this.repository().find({
      order: { name: 'ASC' },
    });
  }

  static async listActive(): Promise<Country[]> {
    return this.repository().find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  static async getById(id: string): Promise<Country | null> {
    return this.repository().findOne({
      where: { id },
    });
  }

  static async getByCode(code: string): Promise<Country | null> {
    return this.repository().findOne({
      where: { code },
    });
  }

  static async create(input: CreateCountryInput): Promise<Country> {
    const repo = this.repository();

    // Check if code already exists
    const existing = await repo.findOne({ where: { code: input.code } });
    if (existing) {
      throw new Error(`Country with code ${input.code} already exists`);
    }

    const country = repo.create({
      name: input.name,
      code: input.code.toUpperCase(),
      phoneCode: input.phoneCode,
      flag: input.flag,
      isActive: input.isActive ?? true,
    });

    return repo.save(country);
  }

  static async update(id: string, input: UpdateCountryInput): Promise<Country> {
    const repo = this.repository();
    const country = await repo.findOne({ where: { id } });

    if (!country) {
      throw new Error('Country not found');
    }

    // Check if code is being changed and if new code already exists
    if (input.code && input.code.toUpperCase() !== country.code) {
      const existing = await repo.findOne({ 
        where: { code: input.code.toUpperCase() },
      });
      if (existing) {
        throw new Error(`Country with code ${input.code} already exists`);
      }
    }

    Object.assign(country, {
      ...input,
      code: input.code ? input.code.toUpperCase() : country.code,
    });

    return repo.save(country);
  }

  static async delete(id: string): Promise<void> {
    const repo = this.repository();
    const country = await repo.findOne({ where: { id } });

    if (!country) {
      throw new Error('Country not found');
    }

    await repo.remove(country);
  }

  static async toggleActive(id: string): Promise<Country> {
    const repo = this.repository();
    const country = await repo.findOne({ where: { id } });

    if (!country) {
      throw new Error('Country not found');
    }

    country.isActive = !country.isActive;
    return repo.save(country);
  }

  /**
   * Sync countries from REST Countries API
   * This will create/update countries automatically
   */
  static async syncCountries(): Promise<{ created: number; updated: number; total: number }> {
    const repo = this.repository();
    let created = 0;
    let updated = 0;

    try {
      // Fetch all countries from REST Countries API with specific fields
      const response = await axios.get('https://restcountries.com/v3.1/all?fields=name,cca2,idd,flag');
      const countriesData = response.data;
      console.log(`Fetched ${countriesData.length} countries from REST Countries API`);

      // Process each country
      for (const countryData of countriesData) {
        try {
          const code = countryData.cca2?.toUpperCase();
          const name = countryData.name?.common;
          
          if (!code || !name) {
            console.warn(`Skipping country with missing code or name:`, countryData);
            continue;
          }
          
          // Extract phone code
          let phoneCode = '';
          if (countryData.idd?.root && countryData.idd?.suffixes?.length > 0) {
            phoneCode = countryData.idd.root + countryData.idd.suffixes[0];
          } else if (countryData.idd?.root) {
            phoneCode = countryData.idd.root;
          }

          if (!phoneCode || phoneCode === '+') {
            // Skip countries without valid phone codes
            console.warn(`Skipping country ${code} (${name}): No valid phone code`);
            continue;
          }

          const flag = countryData.flag || '';

          // Check if country exists
          let country = await repo.findOne({ where: { code } });

          if (country) {
            // Update existing country
            country.name = name;
            country.phoneCode = phoneCode;
            if (flag) {
              country.flag = flag;
            }
            await repo.save(country);
            updated++;
          } else {
            // Create new country
            country = repo.create({
              name,
              code,
              phoneCode,
              flag,
              isActive: true,
            });
            await repo.save(country);
            created++;
          }
        } catch (error) {
          console.error(`Failed to process country ${countryData.cca2}:`, error);
          // Continue with next country
        }
      }

      return {
        created,
        updated,
        total: created + updated,
      };
    } catch (error) {
      console.error('Failed to fetch from REST Countries API:', error);
      throw new Error(`Failed to sync countries from API: ${(error as Error).message}`);
    }
  }
}

