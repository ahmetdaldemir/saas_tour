# WebSocket Troubleshooting Guide

## Sorun: WebSocket connection to 'wss://api.saastour360.com/socket.io/' failed

## Kontrol Edilmesi Gerekenler

### 1. Cloudflare WebSocket Desteği
Cloudflare kullanılıyorsa, WebSocket desteği otomatik olarak aktif olmalıdır. Ancak kontrol edin:

**Cloudflare Dashboard:**
1. DNS sekmesine gidin
2. `api.saastour360.com` kaydını bulun
3. "Proxy status" **"Proxied"** (turuncu bulut) olmalı
4. WebSocket otomatik olarak desteklenir

**Not:** Cloudflare'de WebSocket için özel bir ayar yok - otomatik olarak desteklenir.

### 2. Production'da Container Restart
Yeni Traefik route'larının uygulanması için:

```bash
# Sunucuda
cd /var/www/html/saastour360/infra
docker-compose restart backend frontend

# Veya tüm stack'i restart
docker-compose restart
```

### 3. Traefik Route Kontrolü
Traefik dashboard'da route'ları kontrol edin:

1. `http://traefik.local.saastour360.test:8081` (local)
2. Veya production'da Traefik API'sini kullanın

Route'ların doğru algılandığını kontrol edin:
- `backend-ws-http` (priority 20)
- `backend-ws-https` (priority 20)

### 4. Socket.io Polling Fallback
Socket.io otomatik olarak polling'e düşer. WebSocket başarısız olsa bile bağlantı çalışır:

```javascript
// Frontend'de Socket.io config
transports: ['websocket', 'polling'] // Polling fallback var
```

### 5. Browser Console Kontrolü
Browser console'da:
- WebSocket bağlantı detaylarını kontrol edin
- Hangi transport kullanıldığını görün
- Hata mesajını detaylı inceleyin

### 6. Network Tab Kontrolü
Browser DevTools > Network tab:
- WebSocket upgrade request'ini kontrol edin
- Response headers'ı inceleyin
- Status code'u kontrol edin (101 = WebSocket upgrade successful)

## Çözüm

1. **Production'da container'ları restart edin**
2. **Cloudflare proxy ayarlarını kontrol edin**
3. **Socket.io polling fallback zaten çalışıyor - bu normal**

WebSocket başarısız olsa bile Socket.io polling ile çalışmaya devam eder.

