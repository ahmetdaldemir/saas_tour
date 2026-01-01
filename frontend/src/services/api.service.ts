/**
 * Central API Service
 * 
 * This service provides type-safe access to all API endpoints.
 * All endpoint paths are imported from the shared API routes registry.
 * 
 * Usage:
 *   import { apiService } from '@/services/api.service';
 *   const data = await apiService.auth.login({ email, password });
 */

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { API_ROUTES } from '../../../backend/src/config/api-routes';

// Import the API_ROUTES type (in production, this should be a shared package)
// For now, we'll define it here for frontend usage
const API_ROUTES_FRONTEND = {
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    me: '/api/auth/me',
    logout: '/api/auth/logout',
  },
  finance: {
    categories: {
      list: '/api/finance/categories',
      getById: (id: string) => `/api/finance/categories/${id}`,
      create: '/api/finance/categories',
      update: (id: string) => `/api/finance/categories/${id}`,
      delete: (id: string) => `/api/finance/categories/${id}`,
    },
    transactions: {
      list: '/api/finance/transactions',
      getById: (id: string) => `/api/finance/transactions/${id}`,
      create: '/api/finance/transactions',
      update: (id: string) => `/api/finance/transactions/${id}`,
      delete: (id: string) => `/api/finance/transactions/${id}`,
    },
    // ... add other endpoints as needed
  },
} as const;

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL ?? 'https://api.saastour360.com/api',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  setAuthToken(token: string | null) {
    if (token) {
      this.client.defaults.headers.common.Authorization = `Bearer ${token}`;
      localStorage.setItem('auth_token', token);
    } else {
      delete this.client.defaults.headers.common.Authorization;
      localStorage.removeItem('auth_token');
    }
  }

  // Auth endpoints
  auth = {
    login: (credentials: { email: string; password: string }) =>
      this.client.post(API_ROUTES_FRONTEND.auth.login, credentials),
    register: (data: any) =>
      this.client.post(API_ROUTES_FRONTEND.auth.register, data),
    me: () =>
      this.client.get(API_ROUTES_FRONTEND.auth.me),
    logout: () =>
      this.client.post(API_ROUTES_FRONTEND.auth.logout),
  };

  // Finance endpoints
  finance = {
    categories: {
      list: (params?: any) =>
        this.client.get(API_ROUTES_FRONTEND.finance.categories.list, { params }),
      getById: (id: string) =>
        this.client.get(API_ROUTES_FRONTEND.finance.categories.getById(id)),
      create: (data: any) =>
        this.client.post(API_ROUTES_FRONTEND.finance.categories.create, data),
      update: (id: string, data: any) =>
        this.client.patch(API_ROUTES_FRONTEND.finance.categories.update(id), data),
      delete: (id: string) =>
        this.client.delete(API_ROUTES_FRONTEND.finance.categories.delete(id)),
    },
    transactions: {
      list: (params?: any) =>
        this.client.get(API_ROUTES_FRONTEND.finance.transactions.list, { params }),
      getById: (id: string) =>
        this.client.get(API_ROUTES_FRONTEND.finance.transactions.getById(id)),
      create: (data: any) =>
        this.client.post(API_ROUTES_FRONTEND.finance.transactions.create, data),
      update: (id: string, data: any) =>
        this.client.patch(API_ROUTES_FRONTEND.finance.transactions.update(id), data),
      delete: (id: string) =>
        this.client.delete(API_ROUTES_FRONTEND.finance.transactions.delete(id)),
    },
  };

  // Generic request method for direct endpoint access
  request<T = any>(config: AxiosRequestConfig): Promise<T> {
    return this.client.request<T>(config);
  }

  // Get the underlying axios instance if needed
  getInstance(): AxiosInstance {
    return this.client;
  }
}

export const apiService = new ApiService();

// Export for backward compatibility with existing code
export const http = apiService.getInstance();

