# Mobil Uygulama Login Analizi

## ✅ Tenant User Kullanımı DOĞRU

Mobil uygulama **tenant user** ile login olmalı. Bu doğru yaklaşım çünkü:

1. **Tenant User**: Her tenant'ın kendi kullanıcıları var (`TenantUser` entity)
2. **JWT Token**: Login sonrası token'da `tenantId` bilgisi var
3. **Tenant Context**: Kullanıcı hangi tenant'a aitse o tenant'ın verilerine erişir

## ✅ Subdomain Kontrolü Bypass Ediliyor

Mobil uygulamadan login olurken **subdomain kontrolü yapılmıyor**. Kod zaten bunu destekliyor.

### Kod Analizi

#### 1. Tenant Middleware (`backend/src/middleware/tenant.middleware.ts`)

```typescript
// Satır 73-77
if (!tenantSlug) {
  // No tenant slug found - allow request to proceed
  // This maintains backward compatibility if Host header doesn't match pattern
  logger.debug('No tenant slug found in Host header', { host });
  return next(); // ✅ Request devam ediyor, req.tenant = null
}
```

**Sonuç**: Mobil uygulama IP adresi veya localhost kullandığı için subdomain yok. Middleware `req.tenant = null` bırakıyor ve request devam ediyor.

#### 2. Login Controller (`backend/src/modules/auth/controllers/auth.controller.ts`)

```typescript
// Satır 29-45
static async login(req: TenantRequest, res: Response) {
  const { email, password } = req.body;
  const { token, user, tenant, settings } = await AuthService.login({ email, password });

  // Verify that the user belongs to the tenant from subdomain
  // NOTE: For mobile apps, req.tenant will be null (no subdomain), so this check is bypassed
  // This allows mobile apps to login without subdomain requirement
  if (req.tenant && req.tenant.id !== user.tenantId) {
    return res.status(403).json({ 
      message: 'Tenant mismatch: This user does not belong to this tenant' 
    });
  }
  // ✅ req.tenant null ise kontrol bypass ediliyor
}
```

**Sonuç**: 
- Web'den login: `req.tenant` var → Tenant kontrolü yapılıyor
- Mobil'den login: `req.tenant = null` → Kontrol bypass ediliyor ✅

#### 3. Auth Service (`backend/src/modules/auth/services/auth.service.ts`)

```typescript
// Satır 98-137
static async login(input: LoginInput) {
  const user = await this.validateCredentials(input); // Email/password ile user bulunuyor
  // ...
  const tenant = await tenantRepo.findOne({ where: { id: user.tenantId } });
  // User'ın tenant'ı bulunuyor ve döndürülüyor
}
```

**Sonuç**: Login işlemi sadece email/password ile çalışıyor, subdomain gerektirmiyor.

## 🔍 Login Akışı

### Web Uygulaması (Subdomain ile)
```
1. Kullanıcı: sunset.saastour360.com → /api/auth/login
2. Tenant Middleware: Host header'dan "sunset" çıkarılıyor
3. req.tenant = { id: "...", slug: "sunset" }
4. Login Controller: req.tenant.id === user.tenantId kontrolü yapılıyor
5. ✅ Eşleşirse login başarılı
```

### Mobil Uygulama (IP/Subdomain yok)
```
1. Kullanıcı: http://192.168.1.180:4001/api/auth/login
2. Tenant Middleware: Host header'da subdomain yok
3. req.tenant = null
4. Login Controller: req.tenant null olduğu için kontrol bypass ediliyor
5. ✅ Login başarılı (sadece email/password kontrolü)
```

## 📱 Mobil Uygulama Login Kodu

### Login Screen (`mobile/src/screens/LoginScreen.tsx`)
```typescript
const handleLogin = async () => {
  await login(email, password); // Sadece email ve password
};
```

### Auth Service (`mobile/src/services/auth.service.ts`)
```typescript
async login(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await apiClient.instance.post<AuthResponse>(
    buildEndpoint(API_ENDPOINTS.auth.login), // POST /api/auth/login
    credentials // { email, password }
  );
  // Token ve user bilgileri dönüyor
}
```

### API Client (`mobile/src/services/api.ts`)
```typescript
constructor() {
  this.client = axios.create({
    baseURL: config.apiBaseUrl, // http://192.168.1.180:4001/api
    // Subdomain yok, direkt IP adresi
  });
}
```

## ✅ Sonuç

1. **Tenant User kullanımı DOĞRU** ✅
   - Mobil uygulama tenant user ile login olmalı
   - Her tenant'ın kendi kullanıcıları var

2. **Subdomain kontrolü YAPILMIYOR** ✅
   - Mobil uygulamadan login olurken subdomain kontrolü bypass ediliyor
   - Kod zaten mobil uygulamalar için hazır
   - `req.tenant = null` olduğunda kontrol atlanıyor

3. **Güvenlik**
   - Login sadece email/password ile yapılıyor
   - JWT token'da tenantId var, sonraki isteklerde tenant context korunuyor
   - Web'den login olurken subdomain kontrolü yapılıyor (güvenlik)

## 🔒 Güvenlik Notları

1. **Mobil Uygulama**: Subdomain kontrolü yok, sadece email/password
2. **Web Uygulama**: Subdomain kontrolü var, tenant güvenliği sağlanıyor
3. **JWT Token**: Her token'da tenantId var, sonraki isteklerde tenant context korunuyor
4. **Tenant Isolation**: Her kullanıcı sadece kendi tenant'ının verilerine erişebilir

## 📝 Öneriler

Kod zaten doğru çalışıyor, ancak şunları yapabilirsiniz:

1. **Mobil Uygulama için Özel Endpoint** (Opsiyonel)
   - `/api/mobile/auth/login` gibi özel bir endpoint oluşturabilirsiniz
   - Ancak mevcut kod zaten çalışıyor, gerek yok

2. **Logging İyileştirme**
   - Mobil login'lerde "mobile app login" log'u eklenebilir
   - Debug için faydalı olur

3. **Rate Limiting**
   - Login endpoint'ine rate limiting eklenebilir
   - Brute force saldırılarına karşı koruma

## 🧪 Test Senaryoları

### ✅ Test 1: Mobil Uygulama Login
```
1. Mobil uygulamadan login ol
2. Email: tenant-user@example.com
3. Password: ********
4. ✅ Login başarılı olmalı (subdomain kontrolü yok)
```

### ✅ Test 2: Web Uygulama Login (Subdomain ile)
```
1. Web'den login ol: sunset.saastour360.com/api/auth/login
2. Email: tenant-user@example.com
3. Password: ********
4. ✅ Login başarılı (subdomain kontrolü yapıldı)
```

### ✅ Test 3: Web Uygulama Login (Yanlış Tenant)
```
1. Web'den login ol: sunset.saastour360.com/api/auth/login
2. Email: other-tenant-user@example.com (farklı tenant)
3. Password: ********
4. ❌ 403 Tenant mismatch hatası (güvenlik)
```

