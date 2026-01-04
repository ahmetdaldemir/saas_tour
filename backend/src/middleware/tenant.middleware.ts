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
 * Check if hostname is an IP address (IPv4 or IPv6)
 */
function isIpAddress(hostname: string): boolean {
  // IPv4 pattern: numbers and dots (e.g., 192.168.1.1, 10.0.2.2)
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  
  // IPv6 pattern: contains colons (e.g., ::1, 2001:0db8::1)
  const ipv6Pattern = /:/;
  
  return ipv4Pattern.test(hostname) || ipv6Pattern.test(hostname);
}

/**
 * Extract tenant slug from Host header
 * Examples:
 *   - sunset.saastour360.com -> sunset
 *   - sunset.local.saastour360.test -> sunset
 *   - sunset.local.saastour360.test:9001 -> sunset
 *   - 10.0.2.2:4001 -> null (IP address, not a tenant subdomain)
 *   - localhost:4001 -> null (IP address/localhost, not a tenant subdomain)
 */
function extractTenantSlug(host: string | undefined): string | null {
  if (!host) {
    return null;
  }

  // Remove port if present
  const hostname = host.split(':')[0];

  // Skip IP addresses (mobile apps, localhost, etc.)
  if (isIpAddress(hostname) || hostname === 'localhost') {
    return null;
  }

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
 * 
 * NOTE: Admin routes (/api/admin/*) are excluded from tenant resolution
 * as they operate on the main domain without tenant context
 */
export const tenantMiddleware = async (
  req: TenantRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Skip tenant resolution for admin routes (main domain operations)
    if (req.path.startsWith('/api/admin/')) {
      logger.debug('Skipping tenant resolution for admin route', { path: req.path });
      return next();
    }

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
    logger.error('Error in tenant middleware', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      host: req.get('host'),
      tenantSlug: extractTenantSlug(req.get('host')),
    });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to resolve tenant',
        details: error instanceof Error ? error.message : String(error),
      },
    });
    return;
  }
};

