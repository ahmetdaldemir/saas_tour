import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { http, setAuthToken } from '../modules/http';

export interface AdminUserDto {
  id: string;
  username: string;
  name?: string;
  email?: string;
  type: 'admin';
}

const ADMIN_TOKEN_KEY = 'saas_tour_admin_token';

export const useAdminAuthStore = defineStore('adminAuth', () => {
  const token = ref<string | null>(null);
  const user = ref<AdminUserDto | null>(null);
  const loading = ref(false);
  const initialized = ref(false);
  let initPromise: Promise<void> | null = null;

  const isAuthenticated = computed(() => !!token.value && !!user.value);

  const setSession = (newToken: string | null, userDto?: AdminUserDto | null) => {
    token.value = newToken;
    user.value = userDto ?? null;

    if (newToken) {
      localStorage.setItem(ADMIN_TOKEN_KEY, newToken);
    } else {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
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
      const stored = localStorage.getItem(ADMIN_TOKEN_KEY);
      if (!stored) {
        setSession(null);
        initialized.value = true;
        initPromise = null;
        return;
      }

      setSession(stored);
      try {
        const { data } = await http.get<{ user: AdminUserDto }>('/admin/auth/me');
        setSession(stored, data.user);
      } catch (error) {
        setSession(null);
      } finally {
        initialized.value = true;
        initPromise = null;
      }
    })();

    return initPromise;
  };

  const login = async (username: string, password: string) => {
    loading.value = true;
    try {
      const { data } = await http.post<{
        token: string;
        user: AdminUserDto;
      }>('/admin/auth/login', { username, password });
      setSession(data.token, data.user);
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

  return {
    token,
    user,
    loading,
    isAuthenticated,
    initialized,
    initialize,
    ensureSession,
    login,
    logout,
  };
});

