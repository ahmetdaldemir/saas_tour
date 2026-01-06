import axios from 'axios';

/**
 * HTTP Client for API requests
 * 
 * Frontend uses subdomain-based routing (berg.saastour360.com/api/...)
 * Same as Vue frontend: baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api'
 * 
 * For local development with subdomain: berg.local.saastour360.test:5001/api
 * The relative path '/api' will automatically use the current origin (subdomain)
 */
const getBaseURL = () => {
  // Check for environment variable first (for absolute URLs like http://berg.local.saastour360.test:5001/api)
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  // Fallback to relative path (works with subdomain routing)
  // This will use the current origin (subdomain) + /api
  // Example: If on berg.local.saastour360.test:3000, requests go to berg.local.saastour360.test:3000/api
  // But if backend is on port 5001, we need to handle that
  return 'http://berg.local.saastour360.test:5001/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  // Add timeout
  timeout: 30000,
});

// Request interceptor - add auth token
// Vue frontend uses 'saas_tour_token' from localStorage (from auth store)
// But also checks 'auth_token' as fallback
api.interceptors.request.use(
  (config) => {
    // Check for token in localStorage (same keys as Vue frontend)
    // Vue frontend checks: 'saas_tour_admin_token' first, then 'auth_token'
    // But auth store uses 'saas_tour_token'
    const adminToken = localStorage.getItem('saas_tour_admin_token');
    const tenantToken = localStorage.getItem('saas_tour_token') || localStorage.getItem('auth_token');
    const token = adminToken || tenantToken;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
 
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      const authState = useAuthStore.getState();
      if (authState?.logout) {
        authState.logout();
      }
      // Redirect to login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

