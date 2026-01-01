import { apiClient } from './api';
import { API_ENDPOINTS, buildEndpoint } from './api-endpoints';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'editor' | 'viewer';
    tenantId: string;
  };
  tenant: {
    id: string;
    name: string;
    slug: string;
    category: 'tour' | 'rentacar';
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  tenantId: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  category: 'tour' | 'rentacar';
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.instance.post<AuthResponse>(
      buildEndpoint(API_ENDPOINTS.auth.login),
      credentials
    );
    await apiClient.setToken(response.data.token);
    return response.data;
  }

  async me(): Promise<{ user: User; tenant: Tenant }> {
    const response = await apiClient.instance.get<{ user: User; tenant: Tenant }>(
      buildEndpoint(API_ENDPOINTS.auth.me)
    );
    return response.data;
  }

  async logout(): Promise<void> {
    await apiClient.setToken(null);
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await apiClient.getToken();
    return !!token;
  }
}

export const authService = new AuthService();

