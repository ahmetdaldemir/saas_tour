import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const TOKEN_KEY = 'saas_tour_token';

const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      tenant: null,
      initialized: false,

      setAuth: (token, user, tenant) => {
        set({ token, user, tenant, initialized: true });
        // Also store token in localStorage with the same key as Vue frontend
        if (token) {
          localStorage.setItem(TOKEN_KEY, token);
        } else {
          localStorage.removeItem(TOKEN_KEY);
        }
      },

      logout: async () => {
        try {
          // Call backend logout endpoint if token exists
          const { token } = get();
          if (token) {
            try {
              const apiModule = await import('../services/api');
              const apiInstance = apiModule.default;
              await apiInstance.post('/auth/logout');
            } catch (error) {
              // Logout endpoint might not exist or failed, continue with local logout
              console.warn('Logout API call failed:', error);
            }
          }
        } catch (error) {
          console.error('Error during logout:', error);
        } finally {
          // Always clear local state and storage
          set({ token: null, user: null, tenant: null, initialized: true });
          localStorage.removeItem(TOKEN_KEY);
          // Also clear other token keys for compatibility
          localStorage.removeItem('auth_token');
          localStorage.removeItem('saas_tour_admin_token');
        }
      },

      initialize: async () => {
        // Prevent multiple simultaneous initializations
        const currentState = get();
        if (currentState.initialized) {
          return;
        }

        // First check localStorage for token (compatibility with Vue frontend)
        // Vue frontend uses 'saas_tour_token' key
        const storedToken = localStorage.getItem(TOKEN_KEY);
        const { token: stateToken } = currentState;
        
        // Use stored token if state doesn't have it
        const token = stateToken || storedToken;
        
        if (!token) {
          set({ initialized: true });
          return;
        }

        // If state doesn't have token but localStorage does, set it
        if (!stateToken && storedToken) {
          set({ token: storedToken });
        }

        try {
          // Verify token and get user/tenant
          // Import api dynamically to avoid circular dependency
          const apiModule = await import('../services/api');
          const apiInstance = apiModule.default;
          
          const { data } = await apiInstance.get('/auth/me');
          set({ 
            token, 
            user: data.user, 
            tenant: data.tenant, 
            initialized: true 
          });
          // Ensure token is stored in localStorage with correct key
          if (token) {
            localStorage.setItem(TOKEN_KEY, token);
          }
        } catch (error) {
          console.error('Auth initialization failed:', error);
          // Token invalid, clear everything
          set({ token: null, user: null, tenant: null, initialized: true });
          localStorage.removeItem(TOKEN_KEY);
        }
      },
    }),
    {
      name: 'auth-storage',
      // Only persist token, user, and tenant
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        tenant: state.tenant,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Also sync with localStorage token key
          if (state.token) {
            localStorage.setItem(TOKEN_KEY, state.token);
          }
          // Initialize after rehydration
          state.initialize();
        }
      },
    }
  )
);

export { useAuthStore };

