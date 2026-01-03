import axios from 'axios';

/**
 * HTTP Client for API requests
 * 
 * Frontend uses subdomain-based routing (berg.saastour360.com/api/...)
 * Mobile uses api.saastour360.com/api/...
 * 
 * For centralized API management, use apiService from '@/services/api.service'
 * This file is kept for backward compatibility with existing code.
 */
export const http = axios.create({
  // Frontend uses /api as baseURL (relative to current origin/subdomain)
  // Mobile uses api.saastour360.com (set via VITE_API_BASE_URL env var)
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api', // /api = relative to current origin
});

// Request interceptor - add auth token
http.interceptors.request.use(
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
http.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('auth_token');
      // Don't redirect automatically, let components handle it
    }
    return Promise.reject(error);
  }
);

export const setAuthToken = (token?: string | null) => {
  if (token) {
    http.defaults.headers.common.Authorization = `Bearer ${token}`;
    localStorage.setItem('auth_token', token);
  } else {
    delete http.defaults.headers.common.Authorization;
    localStorage.removeItem('auth_token');
  }
};
