import { computed } from 'vue';
import { useAuthStore } from '../stores/auth';
import { hasPermission, hasAnyPermission, hasAllPermissions, hasRole, hasAnyRole, Permission } from '../utils/permissions';

/**
 * Composable for permission and role checks in Vue components
 */
export function usePermissions() {
  const auth = useAuthStore();

  const user = computed(() => auth.user);

  const checkPermission = (permission: Permission): boolean => {
    return hasPermission(user.value, permission);
  };

  const checkAnyPermission = (permissions: Permission[]): boolean => {
    return hasAnyPermission(user.value, permissions);
  };

  const checkAllPermissions = (permissions: Permission[]): boolean => {
    return hasAllPermissions(user.value, permissions);
  };

  const checkRole = (role: 'admin' | 'editor' | 'viewer'): boolean => {
    return hasRole(user.value, role);
  };

  const checkAnyRole = (roles: ('admin' | 'editor' | 'viewer')[]): boolean => {
    return hasAnyRole(user.value, roles);
  };

  const isAdmin = computed(() => checkRole('admin'));
  const isEditor = computed(() => checkRole('editor'));
  const isViewer = computed(() => checkRole('viewer'));

  return {
    user,
    checkPermission,
    checkAnyPermission,
    checkAllPermissions,
    checkRole,
    checkAnyRole,
    isAdmin,
    isEditor,
    isViewer,
  };
}

