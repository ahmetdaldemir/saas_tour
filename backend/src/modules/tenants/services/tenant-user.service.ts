import { Repository } from 'typeorm';
import { AppDataSource } from '../../../config/data-source';
import { TenantUser, TenantUserRole } from '../entities/tenant-user.entity';
import bcrypt from 'bcryptjs';

export type CreateTenantUserInput = {
  tenantId: string;
  name: string;
  email: string;
  password: string;
  role?: TenantUserRole;
};

export type UpdateTenantUserInput = {
  name?: string;
  email?: string;
  password?: string;
  role?: TenantUserRole;
};

export class TenantUserService {
  private static repository(): Repository<TenantUser> {
    return AppDataSource.getRepository(TenantUser);
  }

  static async list(tenantId: string): Promise<TenantUser[]> {
    return this.repository().find({
      where: { tenantId },
      relations: ['tenant'],
      order: { createdAt: 'DESC' },
    });
  }

  static async getById(id: string, tenantId: string): Promise<TenantUser | null> {
    return this.repository().findOne({
      where: { id, tenantId },
      relations: ['tenant'],
    });
  }

  static async create(input: CreateTenantUserInput): Promise<TenantUser> {
    const repo = this.repository();

    // Email kontrolü
    const existing = await repo.findOne({ where: { email: input.email } });
    if (existing) {
      throw new Error('Bu e-posta adresi zaten kullanılıyor');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    const user = repo.create({
      tenantId: input.tenantId,
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role ?? TenantUserRole.ADMIN,
    });

    return repo.save(user);
  }

  static async update(id: string, tenantId: string, input: UpdateTenantUserInput): Promise<TenantUser> {
    const repo = this.repository();
    const user = await repo.findOne({ where: { id, tenantId } });

    if (!user) {
      throw new Error('Kullanıcı bulunamadı');
    }

    // Email değiştiriliyorsa kontrol et
    if (input.email && input.email !== user.email) {
      const existing = await repo.findOne({ where: { email: input.email } });
      if (existing) {
        throw new Error('Bu e-posta adresi zaten kullanılıyor');
      }
    }

    // Password değiştiriliyorsa hash'le
    if (input.password) {
      input.password = await bcrypt.hash(input.password, 10);
      (input as any).passwordHash = input.password;
      delete (input as any).password;
    }

    Object.assign(user, {
      name: input.name ?? user.name,
      email: input.email ?? user.email,
      role: input.role ?? user.role,
      ...(input.password ? { passwordHash: (input as any).passwordHash } : {}),
    });

    return repo.save(user);
  }

  static async delete(id: string, tenantId: string): Promise<void> {
    const repo = this.repository();
    const user = await repo.findOne({ where: { id, tenantId } });

    if (!user) {
      throw new Error('Kullanıcı bulunamadı');
    }

    await repo.remove(user);
  }
}

