import { Repository } from 'typeorm';
import { AppDataSource } from '../../../config/data-source';
import { Language } from '../entities/language.entity';

export type CreateLanguageDto = {
  code: string;
  name: string;
  isActive?: boolean;
};

export type UpdateLanguageDto = Partial<CreateLanguageDto>;

export class LanguageService {
  private static repo(): Repository<Language> {
    return AppDataSource.getRepository(Language);
  }

  static list(): Promise<Language[]> {
    return this.repo().find({ order: { name: 'ASC' } });
  }

  static async create(input: CreateLanguageDto): Promise<Language> {
    const existing = await this.repo().findOne({ where: { code: input.code } });
    if (existing) {
      throw new Error('Language code already exists');
    }

    const language = this.repo().create({
      code: input.code,
      name: input.name,
      isActive: input.isActive ?? true,
    });

    return this.repo().save(language);
  }

  static async update(id: string, input: UpdateLanguageDto): Promise<Language> {
    const language = await this.repo().findOne({ where: { id } });
    if (!language) {
      throw new Error('Language not found');
    }

    if (input.code && input.code !== language.code) {
      const exists = await this.repo().findOne({ where: { code: input.code } });
      if (exists) {
        throw new Error('Language code already exists');
      }
      language.code = input.code;
    }

    if (typeof input.name === 'string') {
      language.name = input.name;
    }

    if (typeof input.isActive === 'boolean') {
      language.isActive = input.isActive;
    }

    return this.repo().save(language);
  }

  static async remove(id: string): Promise<void> {
    const language = await this.repo().findOne({ where: { id } });
    if (!language) {
      throw new Error('Language not found');
    }
    await this.repo().remove(language);
  }
}
