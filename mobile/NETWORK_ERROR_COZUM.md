# Network Error Çözüm Rehberi

## 🔍 Sorun Analizi

Android emülatörde "Network Error" alıyorsunuz. Bu genellikle şu sebeplerden olur:

1. **Android Emülatör Localhost Sorunu**: Emülatörde `localhost` veya IP adresi yerine `10.0.2.2` kullanılmalı
2. **Backend Çalışmıyor**: Backend sunucusu çalışmıyor olabilir
3. **CORS Sorunu**: Backend CORS ayarları mobil istekleri kabul etmiyor olabilir
4. **Firewall**: Windows Firewall backend portunu engelliyor olabilir

## ✅ Çözüm Adımları

### 1. Backend'in Çalıştığından Emin Olun

```bash
cd backend
npm run dev
# veya
npm start
```

Backend `http://localhost:4001` adresinde çalışmalı.

**Test:**
```bash
curl http://localhost:4001/health
# veya tarayıcıda: http://localhost:4001/health
```

### 2. Android Emülatör için IP Adresi

**ÖNEMLİ:** Android emülatörde `localhost` veya `192.168.1.180` çalışmaz!

- **Android Emülatör**: `10.0.2.2` kullanılmalı (otomatik olarak ayarlandı ✅)
- **Fiziksel Cihaz**: `192.168.1.180` kullanılmalı

Kod otomatik olarak Android emülatörü tespit edip `10.0.2.2` kullanıyor.

### 3. API URL Kontrolü

`mobile/app.json` dosyasında API URL'i kontrol edin:

```json
{
  "expo": {
    "extra": {
      "apiBaseUrl": "http://192.168.1.180:4001/api"
    }
  }
}
```

**Android Emülatör için:**
- Kod otomatik olarak `10.0.2.2` kullanacak
- Log'larda göreceksiniz: `[Config] Android emülatör tespit edildi, API URL güncellendi: http://10.0.2.2:4001/api`

**Fiziksel Cihaz için:**
- Bilgisayarınızın IP adresini kullanın: `http://192.168.1.180:4001/api`

### 4. CORS Kontrolü

Backend CORS ayarları mobil uygulamalar için hazır:
- Origin yoksa (mobil uygulamalar) otomatik izin veriliyor ✅
- Localhost ve IP adresleri destekleniyor ✅

### 5. Firewall Kontrolü

Windows Firewall'un backend portunu engellemediğinden emin olun:

```powershell
# PowerShell'de (Admin olarak)
netsh advfirewall firewall add rule name="Backend API" dir=in action=allow protocol=TCP localport=4001
```

### 6. Network Bağlantısı Testi

Mobil uygulamadan backend'e bağlantıyı test edin:

```bash
# Android emülatör içinde (adb shell)
adb shell
curl http://10.0.2.2:4001/health

# Fiziksel cihazdan
# Telefonunuzun tarayıcısında: http://192.168.1.180:4001/health
```

## 🔧 Debug Adımları

### 1. Log'ları Kontrol Edin

**Mobil Uygulama Log'ları:**
```bash
# Expo terminal'inde log'lar görünecek
# [API] prefix'li loglar API isteklerini gösterir
```

**Backend Log'ları:**
```bash
cd backend
npm run dev
# Backend log'ları console'da görünecek
```

### 2. API URL'i Console'da Kontrol Edin

Mobil uygulamada:
```typescript
import { config } from './config/env';
console.log('API Base URL:', config.apiBaseUrl);
```

### 3. Network Request'i İnceleyin

Expo DevTools'da:
- Network sekmesinde istekleri görebilirsiniz
- Request URL'i kontrol edin
- Response status'u kontrol edin

## 📱 Platform Bazlı Çözümler

### Android Emülatör

```typescript
// Otomatik olarak 10.0.2.2 kullanılacak
// app.json'da IP adresi varsa, kod otomatik olarak değiştirecek
```

### iOS Simulator (Mac)

```typescript
// localhost veya 127.0.0.1 kullanılabilir
// app.json: "http://localhost:4001/api"
```

### Fiziksel Cihaz

```typescript
// Bilgisayarınızın IP adresini kullanın
// app.json: "http://192.168.1.180:4001/api"
// Telefon ve bilgisayar aynı WiFi ağında olmalı
```

## 🚨 Yaygın Hatalar ve Çözümleri

### Hata: "Network Error"

**Sebep:** Backend'e erişilemiyor

**Çözüm:**
1. Backend'in çalıştığından emin olun
2. Android emülatör için `10.0.2.2` kullanıldığından emin olun
3. Firewall'u kontrol edin

### Hata: "CORS Error"

**Sebep:** Backend CORS ayarları isteği reddediyor

**Çözüm:**
- Backend CORS ayarları mobil uygulamalar için hazır ✅
- Origin yoksa otomatik izin veriliyor ✅

### Hata: "Connection Refused"

**Sebep:** Backend çalışmıyor veya yanlış port

**Çözüm:**
1. Backend'in çalıştığından emin olun: `npm run dev`
2. Port'u kontrol edin: `http://localhost:4001`
3. IP adresini kontrol edin

### Hata: "Timeout"

**Sebep:** Network yavaş veya backend yanıt vermiyor

**Çözüm:**
1. Backend log'larını kontrol edin
2. Network bağlantısını kontrol edin
3. Timeout süresini artırın (şu an 30 saniye)

## ✅ Hızlı Test

1. **Backend Test:**
   ```bash
   curl http://localhost:4001/health
   # Beklenen: {"status":"ok"}
   ```

2. **Mobil Uygulama Test:**
   - Login ekranında email ve password girin
   - Log'larda API URL'i kontrol edin
   - Network request'i kontrol edin

3. **Network Test:**
   ```bash
   # Android emülatör içinde
   adb shell
   curl http://10.0.2.2:4001/health
   ```

## 📝 Notlar

- **Android Emülatör**: `10.0.2.2` otomatik kullanılıyor ✅
- **Fiziksel Cihaz**: Bilgisayarın IP adresi kullanılmalı
- **iOS Simulator**: `localhost` kullanılabilir
- **CORS**: Mobil uygulamalar için hazır ✅
- **Backend**: `http://localhost:4001` adresinde çalışmalı

## 🔄 Sonraki Adımlar

1. Backend'i başlatın: `cd backend && npm run dev`
2. Mobil uygulamayı yeniden başlatın: `npm start`
3. Log'ları kontrol edin
4. Network request'i test edin

Sorun devam ederse:
- Backend log'larını paylaşın
- Mobil uygulama log'larını paylaşın
- Network request detaylarını paylaşın

