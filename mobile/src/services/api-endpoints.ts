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
    login: '/auth/login',
    register: '/auth/register',
    me: '/auth/me',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
  },

  // Operations (Ops) - Primary endpoints for mobile app
  ops: {
    tasks: {
      list: '/ops/tasks',
      getById: (id: string) => `/ops/tasks/${id}`,
      create: '/ops/tasks',
      update: (id: string) => `/ops/tasks/${id}`,
      updateMedia: (id: string) => `/ops/tasks/${id}/media`,
      verifyDocs: (id: string) => `/ops/tasks/${id}/verify-docs`,
      finalize: (id: string) => `/ops/tasks/${id}/finalize`,
      finalizeReturn: (id: string) => `/ops/tasks/${id}/return/finalize`,
      print: (id: string) => `/ops/tasks/${id}/print`,
      start: (id: string) => `/ops/tasks/${id}/start`,
      updateChecklist: (id: string) => `/ops/tasks/${id}/checklist`,
      updateMediaCounts: (id: string) => `/ops/tasks/${id}/media-counts`,
      recordError: (id: string) => `/ops/tasks/${id}/error`,
    },
    performance: {
      myScores: '/ops/performance/my-scores',
      tenantScores: '/ops/performance/tenant-scores',
      userScoreDetails: (userId: string) => `/ops/performance/user/${userId}/score`,
    },
  },

  // Settings
  settings: {
    get: '/settings',
    update: '/settings',
    upload: '/settings/upload',
  },

  // Tenants
  tenants: {
    list: '/tenants',
    getById: (id: string) => `/tenants/${id}`,
  },

  // Tenant Users
  tenantUsers: {
    list: '/tenant-users',
    getById: (id: string) => `/tenant-users/${id}`,
  },

  // Customers (CRM) - Limited access for mobile
  customers: {
    list: '/crm/customers',
    getById: (id: string) => `/crm/customers/${id}`,
  },

  // Reservations
  reservations: {
    list: '/reservations',
    getById: (id: string) => `/reservations/${id}`,
    create: '/reservations',
    update: (id: string) => `/reservations/${id}`,
  },

  // Rentacar (if needed for mobile)
  rentacar: {
    vehicles: {
      search: '/rentacar/vehicles/search',
    },
    locations: {
      list: '/rentacar/locations',
    },
    reservations: {
      create: '/rentacar/reservations',
    },
  },

  // Finance (if needed for mobile)
  finance: {
    reports: {
      summary: '/finance/reports/summary',
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

