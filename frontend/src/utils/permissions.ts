import { TenantUserDto } from '../stores/auth';

export type Permission = 
  // User Management
  | 'user:view' | 'user:create' | 'user:update' | 'user:delete'
  // Languages
  | 'language:view' | 'language:create' | 'language:update' | 'language:delete'
  // Destinations
  | 'destination:view' | 'destination:create' | 'destination:update' | 'destination:delete'
  // Hotels
  | 'hotel:view' | 'hotel:create' | 'hotel:update' | 'hotel:delete'
  // Blogs
  | 'blog:view' | 'blog:create' | 'blog:update' | 'blog:delete'
  // Pages
  | 'page:view' | 'page:create' | 'page:update' | 'page:delete'
  // Tours
  | 'tour:view' | 'tour:create' | 'tour:update' | 'tour:delete'
  // Rent A Car
  | 'vehicle:view' | 'vehicle:create' | 'vehicle:update' | 'vehicle:delete'
  | 'location:view' | 'location:create' | 'location:update' | 'location:delete'
  | 'extra:view' | 'extra:create' | 'extra:update' | 'extra:delete'
  // Customers
  | 'customer:view' | 'customer:create' | 'customer:update' | 'customer:delete'
  // Reservations
  | 'reservation:view' | 'reservation:create' | 'reservation:update' | 'reservation:delete'
  // CRM
  | 'crm:view' | 'crm:create' | 'crm:update' | 'crm:delete'
  // Transfer
  | 'transfer:view' | 'transfer:create' | 'transfer:update' | 'transfer:delete'
  // Chat
  | 'chat:view' | 'chat:manage'
  // Settings
  | 'settings:view' | 'settings:update'
  // Email Templates
  | 'email_template:view' | 'email_template:create' | 'email_template:update' | 'email_template:delete'
  // Surveys
  | 'survey:view' | 'survey:create' | 'survey:update' | 'survey:delete'
  // Admin
  | 'admin:view';

/**
 * Role-based permission mapping
 */
const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: [
    // Admin has all permissions
    'user:view', 'user:create', 'user:update', 'user:delete',
    'language:view', 'language:create', 'language:update', 'language:delete',
    'destination:view', 'destination:create', 'destination:update', 'destination:delete',
    'hotel:view', 'hotel:create', 'hotel:update', 'hotel:delete',
    'blog:view', 'blog:create', 'blog:update', 'blog:delete',
    'page:view', 'page:create', 'page:update', 'page:delete',
    'tour:view', 'tour:create', 'tour:update', 'tour:delete',
    'vehicle:view', 'vehicle:create', 'vehicle:update', 'vehicle:delete',
    'location:view', 'location:create', 'location:update', 'location:delete',
    'extra:view', 'extra:create', 'extra:update', 'extra:delete',
    'customer:view', 'customer:create', 'customer:update', 'customer:delete',
    'reservation:view', 'reservation:create', 'reservation:update', 'reservation:delete',
    'crm:view', 'crm:create', 'crm:update', 'crm:delete',
    'transfer:view', 'transfer:create', 'transfer:update', 'transfer:delete',
    'chat:view', 'chat:manage',
    'settings:view', 'settings:update',
    'email_template:view', 'email_template:create', 'email_template:update', 'email_template:delete',
    'survey:view', 'survey:create', 'survey:update', 'survey:delete',
    'admin:view',
  ],
  editor: [
    // View permissions
    'user:view',
    'language:view',
    'destination:view',
    'hotel:view',
    'blog:view',
    'page:view',
    'tour:view',
    'vehicle:view',
    'location:view',
    'extra:view',
    'customer:view',
    'reservation:view',
    'crm:view',
    'transfer:view',
    'chat:view',
    'settings:view',
    'email_template:view',
    'survey:view',
    'admin:view',
    // Create permissions
    'destination:create',
    'hotel:create',
    'blog:create',
    'page:create',
    'tour:create',
    'vehicle:create',
    'location:create',
    'extra:create',
    'customer:create',
    'reservation:create',
    'crm:create',
    'transfer:create',
    'email_template:create',
    'survey:create',
    // Update permissions
    'destination:update',
    'hotel:update',
    'blog:update',
    'page:update',
    'tour:update',
    'vehicle:update',
    'location:update',
    'extra:update',
    'customer:update',
    'reservation:update',
    'crm:update',
    'transfer:update',
    'email_template:update',
    'survey:update',
  ],
  viewer: [
    // Viewer can only view
    'user:view',
    'language:view',
    'destination:view',
    'hotel:view',
    'blog:view',
    'page:view',
    'tour:view',
    'vehicle:view',
    'location:view',
    'extra:view',
    'customer:view',
    'reservation:view',
    'crm:view',
    'transfer:view',
    'chat:view',
    'settings:view',
    'email_template:view',
    'survey:view',
    'admin:view',
  ],
};

/**
 * Check if user has a specific permission
 */
export function hasPermission(user: TenantUserDto | null, permission: Permission): boolean {
  if (!user) return false;
  const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
  return rolePermissions.includes(permission);
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(user: TenantUserDto | null, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(user, permission));
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(user: TenantUserDto | null, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(user, permission));
}

/**
 * Check if user has a specific role
 */
export function hasRole(user: TenantUserDto | null, role: 'admin' | 'editor' | 'viewer'): boolean {
  if (!user) return false;
  return user.role === role;
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(user: TenantUserDto | null, roles: ('admin' | 'editor' | 'viewer')[]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}

