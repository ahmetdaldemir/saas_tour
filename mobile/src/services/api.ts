import axios, { AxiosInstance, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { config } from '../config/env';

const TOKEN_KEY = 'auth_token';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.apiBaseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor - add auth token and logging
    this.client.interceptors.request.use(
      async (config) => {
        const token = await SecureStore.getItemAsync(TOKEN_KEY);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Log request for debugging
        console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, {
          headers: config.headers,
          data: config.data,
        });
        
        return config;
      },
      (error) => {
        console.error('[API] Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle errors and logging
    this.client.interceptors.response.use(
      (response) => {
        console.log(`[API] ${response.config.method?.toUpperCase()} ${response.config.url} - Success:`, {
          status: response.status,
          data: response.data,
        });
        return response;
      },
      async (error: AxiosError) => {
        console.error(`[API] ${error.config?.method?.toUpperCase()} ${error.config?.url} - Error:`, {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
        });
        
        if (error.response?.status === 401) {
          // Token expired or invalid - clear and redirect to login
          await SecureStore.deleteItemAsync(TOKEN_KEY);
        }
        return Promise.reject(error);
      }
    );
  }

  async setToken(token: string | null) {
    if (token) {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
  }

  async getToken(): Promise<string | null> {
    return SecureStore.getItemAsync(TOKEN_KEY);
  }

  get instance(): AxiosInstance {
    return this.client;
  }
}

export const apiClient = new ApiClient();

