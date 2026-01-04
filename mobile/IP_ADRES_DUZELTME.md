# IP Adresi Tenant Slug Sorunu - Düzeltme

## 🔍 Sorun

Mobil uygulamadan login yaparken şu hata alınıyordu:

```
[WARN] Tenant not found {"tenantSlug":"10","host":"10.0.2.2:4001"}
[WARN] POST /api/auth/login 404
```

### Neden?

Tenant middleware, Host header'dan tenant slug'ı çıkarmaya çalışıyordu:
- `10.0.2.2:4001` → İlk kısım "10" olarak algılanıyordu
- "10" slug'ına sahip tenant aranıyordu
- Bulunamayınca 404 hatası dönüyordu

## ✅ Çözüm

Tenant middleware'e IP adresi kontrolü eklendi:

1. **IP Adresi Tespiti**: IPv4 ve IPv6 pattern'leri kontrol ediliyor
2. **Localhost Kontrolü**: `localhost` da IP adresi olarak kabul ediliyor
3. **Bypass**: IP adresleri için tenant resolution bypass ediliyor

### Yapılan Değişiklikler

**`backend/src/middleware/tenant.middleware.ts`:**

```typescript
// IP adresi kontrolü eklendi
function isIpAddress(hostname: string): boolean {
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Pattern = /:/;
  return ipv4Pattern.test(hostname) || ipv6Pattern.test(hostname);
}

// extractTenantSlug fonksiyonuna IP kontrolü eklendi
if (isIpAddress(hostname) || hostname === 'localhost') {
  return null; // IP adresi için tenant slug null döner
}
```

## 🚀 Şimdi Yapmanız Gerekenler

### 1. Container'ı Yeniden Başlatın

```bash
cd infra
docker-compose restart backend
```

Veya tamamen yeniden build edin:

```bash
cd infra
docker-compose build backend
docker-compose restart backend
```

### 2. Log'ları Kontrol Edin

```bash
docker logs saas-tour-backend -f
```

Artık şu log'u görmelisiniz:
```
[DEBUG] No tenant slug found in Host header {"host":"10.0.2.2:4001"}
```

404 hatası yerine request devam edecek.

### 3. Mobil Uygulamayı Test Edin

```bash
cd mobile
npm start
```

Login ekranında email ve password girin. Artık başarılı olmalı! ✅

## 🔍 Test Senaryoları

### ✅ Çalışması Gerekenler

1. **IP Adresi (Android Emülatör)**: `10.0.2.2:4001` → Tenant resolution bypass ✅
2. **IP Adresi (Fiziksel Cihaz)**: `192.168.1.180:4001` → Tenant resolution bypass ✅
3. **Localhost**: `localhost:4001` → Tenant resolution bypass ✅
4. **Subdomain (Web)**: `sunset.saastour360.com` → Tenant resolution çalışır ✅

### ❌ Çalışmaması Gerekenler

1. **Yanlış Subdomain**: `nonexistent.saastour360.com` → 404 Tenant not found ✅

## 📝 Özet

- ✅ **IP adresleri artık tenant slug olarak algılanmıyor**
- ✅ **Mobil uygulamalar için tenant resolution bypass ediliyor**
- ✅ **Web uygulamaları için subdomain kontrolü devam ediyor**
- ✅ **Container'ı yeniden başlattıktan sonra çalışacak**

## 🔄 Container'ı Güncelleme

Kod değişikliği yaptıysanız:

```bash
# 1. Container'ı yeniden build et
cd infra
docker-compose build backend

# 2. Container'ı yeniden başlat
docker-compose restart backend

# 3. Log'ları kontrol et
docker logs saas-tour-backend -f
```

## 🐛 Sorun Devam Ederse

### Log'ları Kontrol Edin

```bash
docker logs saas-tour-backend -f | grep -i tenant
```

### Health Check

```bash
curl http://localhost:4001/health
# Beklenen: {"status":"ok"}
```

### Login Test

```bash
curl -X POST http://localhost:4001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'
```

