import { Repository } from 'typeorm';
import { AppDataSource } from '../../../config/data-source';
import { Extra, ExtraSalesType } from '../entities/extra.entity';

export type CreateExtraInput = {
  tenantId: string;
  name: string;
  price: number;
  currencyCode?: string;
  isMandatory?: boolean;
  isActive?: boolean;
  salesType?: ExtraSalesType;
  description?: string;
  imageUrl?: string;
};

export type UpdateExtraInput = Partial<Omit<CreateExtraInput, 'tenantId'>>;

export class ExtraService {
  private static repository(): Repository<Extra> {
    return AppDataSource.getRepository(Extra);
  }

  static async list(tenantId: string): Promise<Extra[]> {
    return this.repository().find({
      where: { tenantId },
      order: { name: 'ASC' },
    });
  }

  static async getById(id: string, tenantId: string): Promise<Extra | null> {
    return this.repository().findOne({
      where: { id, tenantId },
    });
  }

  static async create(input: CreateExtraInput): Promise<Extra> {
    const repo = this.repository();
    const extra = repo.create({
      tenantId: input.tenantId,
      name: input.name,
      price: input.price,
      currencyCode: input.currencyCode || 'TRY',
      isMandatory: input.isMandatory || false,
      isActive: input.isActive !== undefined ? input.isActive : true,
      salesType: input.salesType || ExtraSalesType.DAILY,
      description: input.description,
      imageUrl: input.imageUrl,
    });

    return repo.save(extra);
  }

  static async update(id: string, tenantId: string, input: UpdateExtraInput): Promise<Extra> {
    const repo = this.repository();
    const extra = await repo.findOne({ where: { id, tenantId } });

    if (!extra) {
      throw new Error('Extra not found');
    }

    Object.assign(extra, input);
    return repo.save(extra);
  }

  static async remove(id: string, tenantId: string): Promise<void> {
    const repo = this.repository();
    const extra = await repo.findOne({ where: { id, tenantId } });

    if (!extra) {
      throw new Error('Extra not found');
    }

    await repo.remove(extra);
  }
}

