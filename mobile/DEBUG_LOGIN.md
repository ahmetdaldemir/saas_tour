# Login Debugging Guide

## Logları Takip Etme

### 1. Mobile App Console Logları

Expo Go veya simulator'da:
- Metro bundler terminal'inde loglar görünecek
- `[API]` prefix'li loglar API isteklerini gösterir
- `[LoginScreen]` prefix'li loglar login ekranındaki işlemleri gösterir

### 2. Backend Logları

Backend container loglarını görüntülemek için:
```bash
docker logs saas-tour-backend -f
```

Veya backend dizininde:
```bash
cd backend
npm run dev
# Loglar console'da görünecek
```

### 3. Network İsteklerini İnceleme

Mobile app'te:
- React Native Debugger kullanabilirsiniz
- Veya `console.log` ile API istekleri loglanıyor

## Test Credentials

```
Email: support@bergrentacar.com
Password: Password123!
```

## API Endpoint

Login endpoint: `POST /api/auth/login`

Mobil uygulama için:
- Base URL: `http://localhost:4001/api` (development)
- Endpoint: `http://localhost:4001/api/auth/login`

## Beklenen Response

```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "User Name",
    "email": "support@bergrentacar.com",
    "role": "admin",
    "tenantId": "tenant_id"
  },
  "tenant": {
    "id": "tenant_id",
    "name": "Tenant Name",
    "slug": "tenant-slug",
    "category": "rentacar"
  },
  "settings": {
    "site": {...},
    "mail": {...},
    "payment": {...}
  }
}
```

## Sorun Giderme

1. **CORS Hatası**: Backend CORS ayarları mobil uygulamalar için `origin: null` durumunu destekliyor
2. **Tenant Mismatch**: Mobil uygulama için tenant kontrolü bypass edildi (req.tenant null olduğu için)
3. **Network Error**: API base URL'i kontrol edin (`mobile/src/config/env.ts`)

## Log Formatı

### API Request Log
```
[API] POST /api/auth/login {
  headers: { Authorization: 'Bearer ...', Content-Type: 'application/json' },
  data: { email: '...', password: '...' }
}
```

### API Response Log
```
[API] POST /api/auth/login - Success: {
  status: 200,
  data: { token: '...', user: {...}, tenant: {...} }
}
```

### API Error Log
```
[API] POST /api/auth/login - Error: {
  status: 401,
  statusText: 'Unauthorized',
  data: { message: 'Invalid credentials' },
  message: 'Request failed with status code 401'
}
```

