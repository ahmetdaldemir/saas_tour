import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

const TOKEN_KEY = 'saas_tour_token';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';
    
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem(TOKEN_KEY);
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
          localStorage.removeItem(TOKEN_KEY);
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  setAuthToken(token: string | null) {
    if (token) {
      this.client.defaults.headers.common.Authorization = `Bearer ${token}`;
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      delete this.client.defaults.headers.common.Authorization;
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  // Auth endpoints
  auth = {
    login: (credentials: { email: string; password: string }) =>
      this.client.post('/auth/login', credentials),
    me: () => this.client.get('/auth/me'),
    logout: () => this.client.post('/auth/logout'),
  };

  // Generic request method
  request<T = any>(config: AxiosRequestConfig): Promise<T> {
    return this.client.request<T>(config);
  }

  getInstance(): AxiosInstance {
    return this.client;
  }
}

export const apiService = new ApiService();
export default apiService;

