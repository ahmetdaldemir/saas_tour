# API Endpoints Guide

Bu doküman, projedeki tüm API endpoint'lerinin merkezi yönetimi hakkında bilgi verir.

## 📁 Dosya Yapısı

```
backend/src/config/api-routes.ts     # Backend: Tüm route tanımları
frontend/src/services/api.service.ts # Frontend: API service (merkezi yapı)
mobile/src/services/api-endpoints.ts # Mobile: Endpoint registry
```

## 🔗 Base URL

Tüm API istekleri şu base URL üzerinden yapılır:
```
https://api.saastour360.com/api
```

## 📝 Yeni Endpoint Ekleme

### 1. Backend Route'u Ekle

`backend/src/routes/index.ts` dosyasına route'u ekleyin:
```typescript
app.use('/api/yeni-modul', yeniModulRouter);
```

### 2. API Routes Registry'ye Ekle

`backend/src/config/api-routes.ts` dosyasına endpoint'i ekleyin:
```typescript
export const API_ROUTES = {
  // ... mevcut route'lar
  yeniModul: {
    list: '/api/yeni-modul',
    getById: (id: string) => `/api/yeni-modul/${id}`,
    create: '/api/yeni-modul',
    update: (id: string) => `/api/yeni-modul/${id}`,
    delete: (id: string) => `/api/yeni-modul/${id}`,
  },
}
```

### 3. Frontend API Service'e Ekle (Opsiyonel)

`frontend/src/services/api.service.ts` dosyasına servis metodları ekleyin:
```typescript
yeniModul: {
  list: (params?: any) =>
    this.client.get(API_ROUTES_FRONTEND.yeniModul.list, { params }),
  getById: (id: string) =>
    this.client.get(API_ROUTES_FRONTEND.yeniModul.getById(id)),
  // ...
}
```

### 4. Mobile API Endpoints'e Ekle (Opsiyonel)

`mobile/src/services/api-endpoints.ts` dosyasına endpoint'i ekleyin:
```typescript
export const API_ENDPOINTS = {
  // ... mevcut endpoint'ler
  yeniModul: {
    list: '/api/yeni-modul',
    getById: (id: string) => `/api/yeni-modul/${id}`,
  },
}
```

Sonra service dosyasında kullanın:
```typescript
import { API_ENDPOINTS, buildEndpoint } from './api-endpoints';

// Kullanım
const response = await apiClient.instance.get(
  buildEndpoint(API_ENDPOINTS.yeniModul.list)
);
```

## 🔐 Authentication

Tüm authenticated endpoint'ler için JWT token kullanılır:
```
Authorization: Bearer <token>
```

Token, login endpoint'inden alınır:
```typescript
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password"
}
```

## 📱 Mobile App Kullanımı

### Auth Service
```typescript
import { authService } from '@/services/auth.service';

// Login
const response = await authService.login({ email, password });

// Get current user
const { user, tenant } = await authService.me();
```

### Ops Service
```typescript
import { opsService } from '@/services/ops.service';

// List tasks
const tasks = await opsService.getTasks({ type: 'checkout' });

// Get task
const task = await opsService.getTask(taskId);

// Update media
await opsService.updateMedia(taskId, { mediaIds: [...] });
```

### Direct API Call
```typescript
import { apiClient } from '@/services/api';
import { API_ENDPOINTS, buildEndpoint } from '@/services/api-endpoints';

const response = await apiClient.instance.get(
  buildEndpoint(API_ENDPOINTS.ops.tasks.list),
  { params: { type: 'checkout' } }
);
```

## 🌐 Frontend Kullanımı

### API Service (Önerilen)
```typescript
import { apiService } from '@/services/api.service';

// Auth
const response = await apiService.auth.login({ email, password });

// Finance
const categories = await apiService.finance.categories.list();
```

### Direct HTTP (Mevcut kodlar için)
```typescript
import { http } from '@/services/api.service';

const response = await http.get('/api/finance/categories');
```

## 📋 Endpoint Listesi

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Operations (Mobile App)
- `GET /api/ops/tasks` - List tasks
- `GET /api/ops/tasks/:id` - Get task details
- `POST /api/ops/tasks` - Create/get task
- `POST /api/ops/tasks/:id/media` - Update media
- `POST /api/ops/tasks/:id/verify-docs` - Verify documents
- `POST /api/ops/tasks/:id/finalize` - Finalize checkout
- `POST /api/ops/tasks/:id/return/finalize` - Finalize return
- `GET /api/ops/tasks/:id/print` - Get print payload

### Finance
- `GET /api/finance/categories` - List categories
- `GET /api/finance/transactions` - List transactions
- `GET /api/finance/cari` - List cari accounts
- `GET /api/finance/checks` - List checks
- `GET /api/finance/loans` - List loans
- `GET /api/finance/reports/summary` - Get summary

### Rentacar
- `GET /api/rentacar/vehicles` - List vehicles
- `GET /api/rentacar/vehicles/search` - Search vehicles
- `GET /api/rentacar/locations` - List locations
- `POST /api/rentacar/reservations` - Create reservation

Tam liste için `backend/src/config/api-routes.ts` dosyasına bakın.

## 🔄 Backward Compatibility

Mevcut kodlar çalışmaya devam edecek:
- Frontend'de `http` instance'ı hala kullanılabilir
- Mobile'da `apiClient.instance` direkt kullanılabilir
- Yeni endpoint'ler için merkezi yapı kullanılması önerilir

## 🚀 Best Practices

1. **Yeni endpoint eklerken** `api-routes.ts` dosyasını güncelleyin
2. **Type-safe** kullanım için `buildEndpoint` helper'ını kullanın
3. **Service layer** kullanarak business logic'i API çağrılarından ayırın
4. **Error handling** için axios interceptor'larını kullanın
5. **Authentication** token'ı otomatik olarak interceptor'lar ekler

## 📝 Notlar

- Base URL tüm platformlarda aynı: `https://api.saastour360.com/api`
- Mobile app için development mode'da da production URL kullanılır
- Tüm endpoint'ler tenant-scoped (multi-tenant yapı)
- Authentication gerektiren endpoint'ler için token zorunludur

