/**
 * Central API Routes Registry
 * 
 * This file contains all API endpoint paths in a centralized location.
 * When adding new endpoints, update this file to maintain consistency
 * across backend, frontend, and mobile applications.
 */

export const API_ROUTES = {
  // Health
  health: '/health',

  // Auth
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    me: '/api/auth/me',
    logout: '/api/auth/logout',
    refresh: '/api/auth/refresh',
  },

  // Tenants
  tenants: {
    list: '/api/tenants',
    getById: (id: string) => `/api/tenants/${id}`,
    create: '/api/tenants',
    update: (id: string) => `/api/tenants/${id}`,
    delete: (id: string) => `/api/tenants/${id}`,
  },

  // Tenant Users
  tenantUsers: {
    list: '/api/tenant-users',
    getById: (id: string) => `/api/tenant-users/${id}`,
    create: '/api/tenant-users',
    update: (id: string) => `/api/tenant-users/${id}`,
    delete: (id: string) => `/api/tenant-users/${id}`,
  },

  // Languages
  languages: {
    list: '/api/languages',
    getById: (id: string) => `/api/languages/${id}`,
  },

  // Countries
  countries: {
    list: '/api/countries',
    getById: (id: string) => `/api/countries/${id}`,
    create: '/api/countries',
    update: (id: string) => `/api/countries/${id}`,
    delete: (id: string) => `/api/countries/${id}`,
    toggleActive: (id: string) => `/api/countries/${id}/toggle-active`,
    sync: '/api/countries/sync',
  },

  // Currencies
  currencies: {
    list: '/api/currencies',
    getById: (id: string) => `/api/currencies/${id}`,
  },

  // Master Locations
  masterLocations: {
    list: '/api/master-locations',
    getById: (id: string) => `/api/master-locations/${id}`,
    create: '/api/master-locations',
    update: (id: string) => `/api/master-locations/${id}`,
    delete: (id: string) => `/api/master-locations/${id}`,
  },

  // Rentacar
  rentacar: {
    vehicles: {
      list: '/api/rentacar/vehicles',
      getById: (id: string) => `/api/rentacar/vehicles/${id}`,
      create: '/api/rentacar/vehicles',
      update: (id: string) => `/api/rentacar/vehicles/${id}`,
      delete: (id: string) => `/api/rentacar/vehicles/${id}`,
      search: '/api/rentacar/vehicles/search',
      uploadImage: (vehicleId: string) => `/api/rentacar/vehicles/${vehicleId}/images`,
      listImages: (vehicleId: string) => `/api/rentacar/vehicles/${vehicleId}/images`,
      updateImage: (vehicleId: string, imageId: string) => `/api/rentacar/vehicles/${vehicleId}/images/${imageId}`,
      deleteImage: (vehicleId: string, imageId: string) => `/api/rentacar/vehicles/${vehicleId}/images/${imageId}`,
      reorderImages: (vehicleId: string) => `/api/rentacar/vehicles/${vehicleId}/images/reorder`,
    },
    locations: {
      list: '/api/rentacar/locations',
      getById: (id: string) => `/api/rentacar/locations/${id}`,
      create: '/api/rentacar/locations',
      update: (id: string) => `/api/rentacar/locations/${id}`,
      delete: (id: string) => `/api/rentacar/locations/${id}`,
    },
    locationPricing: {
      list: '/api/rentacar/location-pricing',
      bulkCopy: '/api/rentacar/location-pricing/bulk-copy',
    },
    vehicleCategories: {
      list: '/api/rentacar/vehicle-categories',
      getById: (id: string) => `/api/rentacar/vehicle-categories/${id}`,
      create: '/api/rentacar/vehicle-categories',
      update: (id: string) => `/api/rentacar/vehicle-categories/${id}`,
      delete: (id: string) => `/api/rentacar/vehicle-categories/${id}`,
    },
    vehicleBrands: {
      list: '/api/rentacar/vehicle-brands',
      getById: (id: string) => `/api/rentacar/vehicle-brands/${id}`,
      create: '/api/rentacar/vehicle-brands',
      update: (id: string) => `/api/rentacar/vehicle-brands/${id}`,
      delete: (id: string) => `/api/rentacar/vehicle-brands/${id}`,
    },
    vehicleModels: {
      list: '/api/rentacar/vehicle-models',
      getById: (id: string) => `/api/rentacar/vehicle-models/${id}`,
      create: '/api/rentacar/vehicle-models',
      update: (id: string) => `/api/rentacar/vehicle-models/${id}`,
      delete: (id: string) => `/api/rentacar/vehicle-models/${id}`,
    },
    extras: {
      list: '/api/rentacar/extras',
      getById: (id: string) => `/api/rentacar/extras/${id}`,
      create: '/api/rentacar/extras',
      update: (id: string) => `/api/rentacar/extras/${id}`,
      delete: (id: string) => `/api/rentacar/extras/${id}`,
    },
    reservations: {
      create: '/api/rentacar/reservations',
      list: '/api/rentacar/reservations',
      getById: (id: string) => `/api/rentacar/reservations/${id}`,
    },
  },

  // Finance
  finance: {
    categories: {
      list: '/api/finance/categories',
      getById: (id: string) => `/api/finance/categories/${id}`,
      create: '/api/finance/categories',
      update: (id: string) => `/api/finance/categories/${id}`,
      delete: (id: string) => `/api/finance/categories/${id}`,
    },
    cari: {
      list: '/api/finance/cari',
      getById: (id: string) => `/api/finance/cari/${id}`,
      create: '/api/finance/cari',
      update: (id: string) => `/api/finance/cari/${id}`,
      delete: (id: string) => `/api/finance/cari/${id}`,
    },
    transactions: {
      list: '/api/finance/transactions',
      getById: (id: string) => `/api/finance/transactions/${id}`,
      create: '/api/finance/transactions',
      update: (id: string) => `/api/finance/transactions/${id}`,
      delete: (id: string) => `/api/finance/transactions/${id}`,
    },
    checks: {
      list: '/api/finance/checks',
      getById: (id: string) => `/api/finance/checks/${id}`,
      create: '/api/finance/checks',
      update: (id: string) => `/api/finance/checks/${id}`,
      markStatus: (id: string) => `/api/finance/checks/${id}/mark`,
      delete: (id: string) => `/api/finance/checks/${id}`,
    },
    loans: {
      list: '/api/finance/loans',
      getById: (id: string) => `/api/finance/loans/${id}`,
      create: '/api/finance/loans',
      update: (id: string) => `/api/finance/loans/${id}`,
      close: (id: string) => `/api/finance/loans/${id}/close`,
      regenerateInstallments: (id: string) => `/api/finance/loans/${id}/regenerate-installments`,
      delete: (id: string) => `/api/finance/loans/${id}`,
    },
    loanInstallments: {
      list: '/api/finance/loan-installments',
      getById: (id: string) => `/api/finance/loan-installments/${id}`,
      pay: (id: string) => `/api/finance/loan-installments/${id}/pay`,
      cancel: (id: string) => `/api/finance/loan-installments/${id}/cancel`,
    },
    reports: {
      summary: '/api/finance/reports/summary',
    },
  },

  // Operations (Ops)
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

  // Customers (CRM)
  customers: {
    list: '/api/crm/customers',
    getById: (id: string) => `/api/crm/customers/${id}`,
    create: '/api/crm/customers',
    update: (id: string) => `/api/crm/customers/${id}`,
    delete: (id: string) => `/api/crm/customers/${id}`,
  },

  // Reservations
  reservations: {
    list: '/api/reservations',
    getById: (id: string) => `/api/reservations/${id}`,
    create: '/api/reservations',
    update: (id: string) => `/api/reservations/${id}`,
    delete: (id: string) => `/api/reservations/${id}`,
  },

  // Mail
  mail: {
    send: '/api/mail/send',
    sendBulk: '/api/mail/send-bulk',
  },

  // Chat
  chat: {
    widget: {
      send: '/api/chat/widget/send',
    },
    messages: {
      list: '/api/chat/messages',
      send: '/api/chat/messages',
    },
  },
} as const;

/**
 * Type helper for API routes
 */
export type ApiRoute = typeof API_ROUTES;

