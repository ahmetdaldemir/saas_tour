import { create } from 'zustand';
import { authService, User, Tenant } from '../services/auth.service';

interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  tenant: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true });
      const response = await authService.login({ email, password });
      set({
        user: response.user,
        tenant: response.tenant,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    await authService.logout();
    set({
      user: null,
      tenant: null,
      isAuthenticated: false,
    });
  },

  checkAuth: async () => {
    try {
      set({ isLoading: true });
      const isAuth = await authService.isAuthenticated();
      if (isAuth) {
        const { user, tenant } = await authService.me();
        set({
          user,
          tenant,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({
          user: null,
          tenant: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      set({
        user: null,
        tenant: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },
}));

