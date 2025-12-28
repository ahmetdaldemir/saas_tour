# Cloudflare WebSocket Sorun Çözümü

## Sorun
WebSocket bağlantısı `wss://api.saastour360.com/socket.io/` başarısız oluyor.

## Çözüm Adımları

### 1. Cloudflare DNS Ayarları

1. **Cloudflare Dashboard** > **DNS** sekmesine gidin
2. `api.saastour360.com` kaydını bulun
3. **Proxy status** = **"Proxied"** (turuncu bulut) olmalı ✅
4. Kaydedin

### 2. Cloudflare Network Ayarları (Opsiyonel)

1. **Cloudflare Dashboard** > **Network** sekmesine gidin
2. **WebSockets** bölümünü bulun
3. WebSockets'in **AÇIK** olduğundan emin olun
4. Kaydedin

### 3. Cloudflare Page Rules (Gerekirse)

Eğer hala sorun varsa, Page Rule ekleyin:

**Rule:**
- URL Pattern: `api.saastour360.com/socket.io/*`
- Settings:
  - **Cache Level**: Bypass
  - **WebSockets**: ON (eğer varsa)

### 4. Widget.js Güncellemesi

Widget.js dosyası güncellendi:
- `/socket.io/` path eklendi
- Reconnection ayarları eklendi
- Timeout ayarları eklendi

### 5. Widget Socket Bağlantısı - ÖNEMLİ

**Widget'ın bulunduğu sunucuda AYRI bir socket sunucusu GEREKMİYOR! ❌**

Widget şu şekilde çalışır:
1. Widget herhangi bir sunucuda (örn: müşteri sitesinde) yüklenir
2. Widget direkt `api.saastour360.com`'a bağlanır
3. Socket.io bağlantısı ana API sunucusuna (`api.saastour360.com`) yapılır
4. Widget'ın bulunduğu sunucuda socket sunucusu GEREKMEZ ✅

**Widget.js içindeki yapılandırma:**
```javascript
const CONFIG = {
  wsUrl: window.location.protocol === 'https:' 
    ? 'wss://api.saastour360.com'  // Ana API sunucusu
    : 'ws://localhost:4001',
  apiUrl: window.location.protocol === 'https:'
    ? 'https://api.saastour360.com'  // Ana API sunucusu
    : 'http://localhost:4001',
};
```

### 6. Test

```bash
# Socket.io polling test
curl -v "https://api.saastour360.com/socket.io/?EIO=4&transport=polling"

# Widget.js test
curl -I "https://api.saastour360.com/widget.js"
```

### 7. Production'da Container Restart

Değişikliklerin uygulanması için:

```bash
cd /var/www/html/saastour360/infra
docker-compose restart backend
```

## Sorun Giderme

### WebSocket hala başarısız ise:

1. **Cloudflare Logs kontrol edin:**
   - Dashboard > Analytics > Logs
   - WebSocket bağlantı denemelerini kontrol edin

2. **Browser Console kontrol:**
   - F12 > Console
   - WebSocket hata mesajlarını kontrol edin
   - Network tab'da WebSocket upgrade isteğini kontrol edin

3. **Polling fallback:**
   - Socket.io otomatik olarak polling'e düşer
   - WebSocket başarısız olsa bile chat çalışır (daha yavaş olabilir)

4. **Cloudflare SSL/TLS:**
   - SSL/TLS encryption mode = "Full" veya "Full (strict)" olmalı
   - API sunucusu HTTPS sertifikası geçerli olmalı

## Özet

- ✅ Widget'ın bulunduğu sunucuda socket sunucusu GEREKMEZ
- ✅ Widget direkt `api.saastour360.com`'a bağlanır
- ✅ Cloudflare DNS'de "Proxied" olmalı
- ✅ Widget.js güncellendi: `/socket.io/` path eklendi
- ✅ Socket.io polling fallback var (WebSocket başarısız olsa bile çalışır)

