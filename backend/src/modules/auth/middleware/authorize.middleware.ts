import { NextFunction, Response } from 'express';
import { Repository } from 'typeorm';
import { AppDataSource } from '../../../config/data-source';
import { TenantUser, TenantUserRole } from '../../tenants/entities/tenant-user.entity';
import { AuthenticatedRequest } from './auth.middleware';
import { Permission, hasPermission, hasAnyPermission, hasAllPermissions } from '../permissions';
import { ForbiddenError } from '../../../utils/errors';

/**
 * Authorization middleware factory
 * Creates middleware that checks if the authenticated user has the required permission(s)
 */
export function authorize(permission: Permission): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export function authorize(permissions: Permission[], mode?: 'any' | 'all'): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export function authorize(
  permissionOrPermissions: Permission | Permission[],
  mode: 'any' | 'all' = 'any'
): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void> {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.auth) {
        throw new ForbiddenError('Authentication required');
      }

      // Get user from database to get current role
      const userRepo: Repository<TenantUser> = AppDataSource.getRepository(TenantUser);
      const user = await userRepo.findOne({
        where: { id: req.auth.sub },
      });

      if (!user) {
        throw new ForbiddenError('User not found');
      }

      // Check permissions
      const permissions = Array.isArray(permissionOrPermissions) 
        ? permissionOrPermissions 
        : [permissionOrPermissions];
      
      const hasAccess = mode === 'all'
        ? hasAllPermissions(user.role, permissions)
        : hasAnyPermission(user.role, permissions);

      if (!hasAccess) {
        throw new ForbiddenError(`Insufficient permissions. Required: ${permissions.join(', ')}`);
      }

      // Attach user to request for use in controllers
      (req as any).user = user;
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware to check if user has a specific role
 */
export function requireRole(...roles: TenantUserRole[]): (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void> {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.auth) {
        throw new ForbiddenError('Authentication required');
      }

      const userRepo: Repository<TenantUser> = AppDataSource.getRepository(TenantUser);
      const user = await userRepo.findOne({
        where: { id: req.auth.sub },
      });

      if (!user) {
        throw new ForbiddenError('User not found');
      }

      if (!roles.includes(user.role)) {
        throw new ForbiddenError(`Access denied. Required role: ${roles.join(' or ')}`);
      }

      (req as any).user = user;
      next();
    } catch (error) {
      next(error);
    }
  };
}

