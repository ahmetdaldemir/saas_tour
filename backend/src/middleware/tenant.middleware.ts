/**
 * Tenant Resolution Middleware
 * Extracts tenant slug from Host header and resolves tenant from database
 * Sets req.tenant for downstream middleware/controllers
 */

import { Request, Response, NextFunction } from 'express';
import { TenantService } from '../modules/tenants/services/tenant.service';
import { Tenant } from '../modules/tenants/entities/tenant.entity';
import { logger } from '../utils/logger';

export interface TenantRequest extends Request {
  tenant?: Tenant;
  tenantSlug?: string;
}

/**
 * Extract tenant slug from Host header
 * Examples:
 *   - sunset.saastour360.com -> sunset
 *   - sunset.local.saastour360.test -> sunset
 *   - sunset.local.saastour360.test:9001 -> sunset
 */
function extractTenantSlug(host: string | undefined): string | null {
  if (!host) {
    return null;
  }

  // Remove port if present
  const hostname = host.split(':')[0];

  // Split by dots
  const parts = hostname.split('.');

  // Pattern: {tenant}.saastour360.com
  // Pattern: {tenant}.local.saastour360.test
  // First part should be the tenant slug
  if (parts.length >= 2) {
    const firstPart = parts[0];
    
    // Validate slug format: lowercase letters, numbers, hyphens only
    const slugRegex = /^[a-z0-9-]+$/;
    if (slugRegex.test(firstPart)) {
      return firstPart;
    }
  }

  return null;
}

/**
 * Tenant Resolution Middleware
 * Resolves tenant from Host header and sets req.tenant
 */
export const tenantMiddleware = async (
  req: TenantRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const host = req.get('host');
    const tenantSlug = extractTenantSlug(host);

    if (!tenantSlug) {
      // No tenant slug found - allow request to proceed
      // This maintains backward compatibility if Host header doesn't match pattern
      logger.debug('No tenant slug found in Host header', { host });
      return next();
    }

    // Resolve tenant from database
    const tenant = await TenantService.getTenantBySlug(tenantSlug);

    if (!tenant) {
      // Tenant not found - return 404
      logger.warn('Tenant not found', { tenantSlug, host });
      res.status(404).json({
        success: false,
        error: {
          code: 'TENANT_NOT_FOUND',
          message: `Tenant '${tenantSlug}' not found`,
        },
      });
      return;
    }

    // Set tenant on request object
    req.tenant = tenant;
    req.tenantSlug = tenantSlug;

    logger.debug('Tenant resolved', {
      tenantSlug,
      tenantId: tenant.id,
      tenantName: tenant.name,
    });

    next();
  } catch (error) {
    logger.error('Error in tenant middleware', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to resolve tenant',
      },
    });
    return;
  }
};

