import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { http, setAuthToken } from '../modules/http';

export type TenantCategory = 'tour' | 'rentacar';

export interface TenantDto {
  id: string;
  name: string;
  slug: string;
  category: TenantCategory;
  defaultLanguage: string;
  supportEmail?: string | null;
}

export interface TenantUserDto {
  id: string;
  name: string;
  email: string;
  tenantId: string;
  role: 'admin' | 'editor' | 'viewer';
}

const TOKEN_KEY = 'saas_tour_token';

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null);
  const user = ref<TenantUserDto | null>(null);
  const tenant = ref<TenantDto | null>(null);
  const loading = ref(false);
  const initialized = ref(false);
  let initPromise: Promise<void> | null = null;

  const isAuthenticated = computed(() => !!token.value && !!user.value && !!tenant.value);

  const setSession = (newToken: string | null, userDto?: TenantUserDto | null, tenantDto?: TenantDto | null) => {
    token.value = newToken;
    user.value = userDto ?? null;
    tenant.value = tenantDto ?? null;

    if (newToken) {
      localStorage.setItem(TOKEN_KEY, newToken);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }

    setAuthToken(newToken);
  };

  const initialize = async () => {
    if (initialized.value) {
      return;
    }
    if (initPromise) {
      return initPromise;
    }

    initPromise = (async () => {
      const stored = localStorage.getItem(TOKEN_KEY);
      if (!stored) {
        setSession(null);
        initialized.value = true;
        initPromise = null;
        return;
      }

      setSession(stored);
      try {
        const { data } = await http.get<{ user: TenantUserDto; tenant: TenantDto }>('/api/auth/me');
        setSession(stored, data.user, data.tenant);
      } catch (error) {
        setSession(null);
      } finally {
        initialized.value = true;
        initPromise = null;
      }
    })();

    return initPromise;
  };

  const login = async (email: string, password: string) => {
    loading.value = true;
    try {
      const { data } = await http.post<{
        token: string;
        user: TenantUserDto;
        tenant: TenantDto;
      }>('/api/auth/login', { email, password });
      setSession(data.token, data.user, data.tenant);
      initialized.value = true;
      return data;
    } finally {
      loading.value = false;
    }
  };

  const logout = () => {
    setSession(null);
    initialized.value = true;
  };

  const ensureSession = async () => {
    if (!initialized.value) {
      await initialize();
    }
  };

  const signup = async (payload: {
    tenantName: string;
    tenantCategory: TenantCategory;
    tenantDefaultLanguage?: string;
    supportEmail?: string;
    adminName: string;
    adminEmail: string;
    adminPassword: string;
  }) => {
    loading.value = true;
    try {
      const { data } = await http.post<{
        token: string;
        user: TenantUserDto;
        tenant: TenantDto;
      }>('/api/auth/signup', payload);
      setSession(data.token, data.user, data.tenant);
      initialized.value = true;
      return data;
    } finally {
      loading.value = false;
    }
  };

  return {
    token,
    user,
    tenant,
    loading,
    isAuthenticated,
    initialized,
    initialize,
    ensureSession,
    login,
    logout,
    signup,
  };
});
