import axios from 'axios';

/**
 * HTTP Client for API requests
 * 
 * Base URL: https://api.saastour360.com/api
 * 
 * For centralized API management, use apiService from '@/services/api.service'
 * This file is kept for backward compatibility with existing code.
 */
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'https://api.saastour360.com/api',
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
