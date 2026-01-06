import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiService from '../services/api';

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

interface AuthState {
  token: string | null;
  user: TenantUserDto | null;
  tenant: TenantDto | null;
  loading: boolean;
  initialized: boolean;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  ensureSession: () => Promise<void>;
}

// Computed getter
const getIsAuthenticated = (state: AuthState) => 
  !!state.token && !!state.user && !!state.tenant;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      tenant: null,
      loading: false,
      initialized: false,

      initialize: async () => {
        const state = get();
        if (state.initialized) return;

        const storedToken = localStorage.getItem('saas_tour_token');
        if (!storedToken) {
          set({ initialized: true });
          return;
        }

        apiService.setAuthToken(storedToken);
        try {
          const { data } = await apiService.auth.me();
          set({
            token: storedToken,
            user: data.user,
            tenant: data.tenant,
            initialized: true,
          });
        } catch (error) {
          set({
            token: null,
            user: null,
            tenant: null,
            initialized: true,
          });
          apiService.setAuthToken(null);
        }
      },

      login: async (email: string, password: string) => {
        set({ loading: true });
        try {
          const { data } = await apiService.auth.login({ email, password });
          apiService.setAuthToken(data.token);
          set({
            token: data.token,
            user: data.user,
            tenant: data.tenant,
            initialized: true,
            loading: false,
          });
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },

      logout: () => {
        apiService.setAuthToken(null);
        set({
          token: null,
          user: null,
          tenant: null,
          initialized: true,
        });
      },

      ensureSession: async () => {
        const state = get();
        if (!state.initialized) {
          await state.initialize();
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        tenant: state.tenant,
      }),
    }
  )
);

