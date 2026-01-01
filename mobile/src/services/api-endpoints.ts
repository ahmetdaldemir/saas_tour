/**
 * Central API Endpoints Registry for Mobile
 * 
 * This file contains all API endpoint paths used in the mobile app.
 * All endpoints use the base URL from config: https://api.saastour360.com/api
 * 
 * Usage:
 *   import { API_ENDPOINTS } from '@/services/api-endpoints';
 *   const response = await apiClient.instance.get(API_ENDPOINTS.auth.login);
 */

export const API_ENDPOINTS = {
  // Auth
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    me: '/api/auth/me',
    logout: '/api/auth/logout',
    refresh: '/api/auth/refresh',
  },

  // Operations (Ops) - Primary endpoints for mobile app
  ops: {
    tasks: {
      list: '/api/ops/tasks',
      getById: (id: string) => `/api/ops/tasks/${id}`,
      create: '/api/ops/tasks',
      update: (id: string) => `/api/ops/tasks/${id}`,
      updateMedia: (id: string) => `/api/ops/tasks/${id}/media`,
      verifyDocs: (id: string) => `/api/ops/tasks/${id}/verify-docs`,
      finalize: (id: string) => `/api/ops/tasks/${id}/finalize`,
      finalizeReturn: (id: string) => `/api/ops/tasks/${id}/return/finalize`,
      print: (id: string) => `/api/ops/tasks/${id}/print`,
    },
  },

  // Settings
  settings: {
    get: '/api/settings',
    update: '/api/settings',
    upload: '/api/settings/upload',
  },

  // Tenants
  tenants: {
    list: '/api/tenants',
    getById: (id: string) => `/api/tenants/${id}`,
  },

  // Tenant Users
  tenantUsers: {
    list: '/api/tenant-users',
    getById: (id: string) => `/api/tenant-users/${id}`,
  },

  // Customers (CRM) - Limited access for mobile
  customers: {
    list: '/api/crm/customers',
    getById: (id: string) => `/api/crm/customers/${id}`,
  },

  // Reservations
  reservations: {
    list: '/api/reservations',
    getById: (id: string) => `/api/reservations/${id}`,
    create: '/api/reservations',
    update: (id: string) => `/api/reservations/${id}`,
  },

  // Rentacar (if needed for mobile)
  rentacar: {
    vehicles: {
      search: '/api/rentacar/vehicles/search',
    },
    locations: {
      list: '/api/rentacar/locations',
    },
    reservations: {
      create: '/api/rentacar/reservations',
    },
  },

  // Finance (if needed for mobile)
  finance: {
    reports: {
      summary: '/api/finance/reports/summary',
    },
  },
} as const;

/**
 * Type helper for endpoint parameters
 */
export type ApiEndpoint = typeof API_ENDPOINTS;

/**
 * Helper function to build endpoint URLs with parameters
 */
export const buildEndpoint = (
  endpoint: string | ((...args: any[]) => string),
  ...args: any[]
): string => {
  if (typeof endpoint === 'function') {
    return endpoint(...args);
  }
  return endpoint;
};

