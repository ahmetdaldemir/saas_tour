import { Repository } from 'typeorm';
import { AppDataSource } from '../../../config/data-source';
import { ChatWidgetToken } from '../entities/chat-widget-token.entity';
import { Tenant } from '../../tenants/entities/tenant.entity';
import crypto from 'crypto';

export class ChatWidgetTokenService {
  private static tokenRepo(): Repository<ChatWidgetToken> {
    return AppDataSource.getRepository(ChatWidgetToken);
  }

  /**
   * Generate secure random keys for widget authentication
   */
  private static generateKeys(): { publicKey: string; secretKey: string } {
    const publicKey = crypto.randomBytes(32).toString('hex');
    const secretKey = crypto.randomBytes(64).toString('hex');
    return { publicKey, secretKey };
  }

  /**
   * Get or create widget token for a tenant
   */
  static async getOrCreateForTenant(tenantId: string): Promise<ChatWidgetToken> {
    const repo = this.tokenRepo();
    const tenantRepo = AppDataSource.getRepository(Tenant);
    
    let token = await repo.findOne({
      where: { tenantId, isActive: true },
      relations: ['tenant'],
    });

    if (!token) {
      // Load tenant to set relation
      const tenant = await tenantRepo.findOne({ where: { id: tenantId } });
      if (!tenant) {
        throw new Error(`Tenant with id ${tenantId} not found`);
      }

      const { publicKey, secretKey } = this.generateKeys();
      token = repo.create({
        tenant,
        tenantId,
        publicKey,
        secretKey,
        isActive: true,
      });
      token = await repo.save(token);
    }

    return token;
  }

  /**
   * Validate widget token
   */
  static async validateToken(tenantId: string, publicKey: string): Promise<ChatWidgetToken | null> {
    const token = await this.tokenRepo().findOne({
      where: {
        tenantId,
        publicKey,
        isActive: true,
      },
    });

    if (!token) {
      return null;
    }

    // Check expiration if set
    if (token.expiresAt && token.expiresAt < new Date()) {
      return null;
    }

    // Update usage stats
    token.lastUsedAt = new Date();
    token.usageCount += 1;
    await this.tokenRepo().save(token);

    return token;
  }

  /**
   * Get token by tenant ID
   */
  static async getByTenantId(tenantId: string): Promise<ChatWidgetToken | null> {
    return this.tokenRepo().findOne({
      where: { tenantId, isActive: true },
    });
  }

  /**
   * Regenerate token for tenant (invalidates old token)
   */
  static async regenerateToken(tenantId: string): Promise<ChatWidgetToken> {
    const repo = this.tokenRepo();
    const tenantRepo = AppDataSource.getRepository(Tenant);
    
    // Deactivate old token
    const oldToken = await repo.findOne({
      where: { tenantId, isActive: true },
    });
    
    if (oldToken) {
      oldToken.isActive = false;
      await repo.save(oldToken);
    }

    // Load tenant to set relation
    const tenant = await tenantRepo.findOne({ where: { id: tenantId } });
    if (!tenant) {
      throw new Error(`Tenant with id ${tenantId} not found`);
    }

    // Create new token
    const { publicKey, secretKey } = this.generateKeys();
    const newToken = repo.create({
      tenant,
      tenantId,
      publicKey,
      secretKey,
      isActive: true,
    });

    return repo.save(newToken);
  }
}

