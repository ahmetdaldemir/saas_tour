import bcrypt from 'bcryptjs';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { Repository } from 'typeorm';
import { AppDataSource } from '../../../config/data-source';
import { loadEnv } from '../../../config/env';
import { TenantUser, TenantUserRole } from '../../tenants/entities/tenant-user.entity';
import { Tenant, TenantCategory } from '../../tenants/entities/tenant.entity';

const env = loadEnv();

export type RegisterInput = {
  tenantId: string;
  name: string;
  email: string;
  password: string;
  role?: TenantUserRole;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type SignupInput = {
  tenantName: string;
  tenantCategory: TenantCategory;
  tenantDefaultLanguage?: string;
  supportEmail?: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
};

export type AuthTokenPayload = {
  sub: string;
  tenantId: string;
  role: TenantUserRole;
};

export class AuthService {
  private static userRepo(): Repository<TenantUser> {
    return AppDataSource.getRepository(TenantUser);
  }

  static async register(input: RegisterInput): Promise<TenantUser> {
    const tenantRepo = AppDataSource.getRepository(Tenant);
    const tenant = await tenantRepo.findOne({ where: { id: input.tenantId } });
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const existing = await this.userRepo().findOne({ where: { email: input.email } });
    if (existing) {
      throw new Error('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);

    const user = this.userRepo().create({
      tenant,
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role ?? TenantUserRole.ADMIN,
    });

    return this.userRepo().save(user);
  }

  static async validateCredentials({ email, password }: LoginInput): Promise<TenantUser | null> {
    const user = await this.userRepo().findOne({ where: { email } });
    if (!user) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return null;
    }

    return user;
  }

  static createToken(user: TenantUser): string {
    const payload: AuthTokenPayload = {
      sub: user.id,
      tenantId: user.tenantId,
      role: user.role,
    };

    const options: SignOptions = {};
    options.expiresIn = env.auth.tokenExpiresIn as unknown as SignOptions['expiresIn'];

    return jwt.sign(payload, env.auth.jwtSecret as Secret, options);
  }

  static async login(input: LoginInput) {
    const user = await this.validateCredentials(input);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    user.lastLoginAt = new Date();
    await this.userRepo().save(user);

    const token = this.createToken(user);

    const tenantRepo = AppDataSource.getRepository(Tenant);
    const tenant = await tenantRepo.findOne({ where: { id: user.tenantId } });

    return {
      token,
      user,
      tenant,
    };
  }

  private static async generateTenantSlug(base: string): Promise<string> {
    const tenantRepo = AppDataSource.getRepository(Tenant);
    const slugBase = base
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    let slug = slugBase || 'tenant';
    let counter = 1;

    while (await tenantRepo.findOne({ where: { slug } })) {
      slug = `${slugBase}-${counter}`;
      counter += 1;
    }

    return slug;
  }

  static async signup(input: SignupInput) {
    const tenantRepo = AppDataSource.getRepository(Tenant);
    const userRepo = AppDataSource.getRepository(TenantUser);

    const existingUser = await userRepo.findOne({ where: { email: input.adminEmail } });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const slug = await this.generateTenantSlug(input.tenantName);

    const tenant = tenantRepo.create({
      name: input.tenantName,
      slug,
      category: input.tenantCategory,
      defaultLanguage: input.tenantDefaultLanguage ?? 'en',
      supportEmail: input.supportEmail,
    });

    const createdTenant = await tenantRepo.save(tenant);

    const passwordHash = await bcrypt.hash(input.adminPassword, 10);

    const user = userRepo.create({
      tenant: createdTenant,
      name: input.adminName,
      email: input.adminEmail,
      passwordHash,
      role: TenantUserRole.ADMIN,
    });

    const createdUser = await userRepo.save(user);
    const token = this.createToken(createdUser);

    return {
      token,
      user: createdUser,
      tenant: createdTenant,
    };
  }

  static async getProfile(userId: string) {
    const user = await this.userRepo().findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const tenantRepo = AppDataSource.getRepository(Tenant);
    const tenant = await tenantRepo.findOne({ where: { id: user.tenantId } });

    return { user, tenant };
  }
}
