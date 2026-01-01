import { Repository } from 'typeorm';
import { AppDataSource } from '../../../config/data-source';
import { FinanceCari, FinanceCariKind } from '../entities/finance-cari.entity';

export type CreateFinanceCariInput = {
  tenantId: string;
  code?: string | null;
  title: string;
  kind?: FinanceCariKind;
  taxNo?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
  linkedCustomerId?: string | null;
  balanceOpening?: number;
  currency?: string;
  isActive?: boolean;
};

export type UpdateFinanceCariInput = Partial<Omit<CreateFinanceCariInput, 'tenantId'>>;

export class FinanceCariService {
  private static repository(): Repository<FinanceCari> {
    return AppDataSource.getRepository(FinanceCari);
  }

  static async list(tenantId: string, search?: string): Promise<FinanceCari[]> {
    const query = this.repository().createQueryBuilder('cari')
      .where('cari.tenantId = :tenantId', { tenantId });

    if (search) {
      query.andWhere(
        '(cari.title ILIKE :search OR cari.code ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    return query.orderBy('cari.title', 'ASC').getMany();
  }

  static async getById(id: string, tenantId: string): Promise<FinanceCari | null> {
    return this.repository().findOne({
      where: { id, tenantId },
    });
  }

  static async create(input: CreateFinanceCariInput): Promise<FinanceCari> {
    // Auto-generate code if not provided
    if (!input.code) {
      const lastCari = await this.repository().findOne({
        where: { tenantId: input.tenantId },
        order: { createdAt: 'DESC' },
      });
      const nextNumber = lastCari ? parseInt(lastCari.code?.replace('CR-', '') || '0') + 1 : 1;
      input.code = `CR-${String(nextNumber).padStart(6, '0')}`;
    }

    const cari = this.repository().create(input);
    return this.repository().save(cari);
  }

  static async update(id: string, tenantId: string, input: UpdateFinanceCariInput): Promise<FinanceCari> {
    const cari = await this.getById(id, tenantId);
    if (!cari) {
      throw new Error('Cari not found');
    }

    Object.assign(cari, input);
    return this.repository().save(cari);
  }

  static async remove(id: string, tenantId: string): Promise<void> {
    const cari = await this.getById(id, tenantId);
    if (!cari) {
      throw new Error('Cari not found');
    }

    await this.repository().remove(cari);
  }
}

