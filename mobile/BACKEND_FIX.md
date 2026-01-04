# Backend Network Fix

## 🔧 Yapılan Düzeltmeler

### 1. Backend Tüm Ağ Arayüzlerinde Dinliyor
- **Sorun**: Backend sadece `localhost` (127.0.0.1) üzerinde dinliyordu
- **Çözüm**: Backend artık `0.0.0.0` üzerinde dinliyor (tüm ağ arayüzleri)
- **Dosya**: `backend/src/server.ts`

### 2. Default Port 4001
- **Sorun**: Default port 3000'di
- **Çözüm**: Default port 4001 olarak güncellendi
- **Dosya**: `backend/src/config/env.ts`

## ✅ Şimdi Yapmanız Gerekenler

### 1. Backend'i Yeniden Başlatın

```bash
cd backend
npm run dev
```

Backend şu mesajı göstermeli:
```
API running on port 4001 (0.0.0.0:4001)
Accessible from: localhost:4001, 127.0.0.1:4001, and network IPs
```

### 2. Backend'in Çalıştığını Test Edin

**Terminal'de:**
```bash
curl http://localhost:4001/health
# Beklenen: {"status":"ok"}
```

**Tarayıcıda:**
```
http://localhost:4001/health
```

### 3. Android Emülatörden Test Edin

Android emülatör içinde (adb shell):
```bash
adb shell
curl http://10.0.2.2:4001/health
# Beklenen: {"status":"ok"}
```

### 4. Mobil Uygulamayı Yeniden Başlatın

```bash
cd mobile
npm start
```

## 🔍 Sorun Devam Ederse

### Backend Log'larını Kontrol Edin

Backend terminal'inde şunları görmelisiniz:
```
[CORS] No origin header, allowing request
[API] POST /api/auth/login
```

### Network Bağlantısını Test Edin

1. **Backend çalışıyor mu?**
   ```bash
   curl http://localhost:4001/health
   ```

2. **Port açık mı?**
   ```bash
   netstat -an | findstr 4001
   # Windows'ta port'un LISTENING olduğunu görmelisiniz
   ```

3. **Firewall kontrolü**
   - Windows Firewall'un 4001 portunu engellemediğinden emin olun

## 📝 Notlar

- Backend artık `0.0.0.0:4001` üzerinde dinliyor
- Android emülatör `10.0.2.2:4001` üzerinden erişebilir
- Fiziksel cihaz `192.168.1.180:4001` üzerinden erişebilir
- CORS ayarları mobil uygulamalar için hazır ✅

## 🚀 Hızlı Test

```bash
# 1. Backend'i başlat
cd backend
npm run dev

# 2. Başka bir terminal'de test et
curl http://localhost:4001/health

# 3. Mobil uygulamayı başlat
cd mobile
npm start
```

