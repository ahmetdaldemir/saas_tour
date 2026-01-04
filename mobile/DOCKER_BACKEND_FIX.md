# Docker Backend Port Mapping Fix

## 🔧 Yapılan Düzeltmeler

### 1. Docker Compose Port Mapping Eklendi
- **Sorun**: Backend container'ı port mapping olmadan çalışıyordu
- **Çözüm**: `infra/docker-compose.yml` dosyasına port mapping eklendi
- **Port Mapping**: `4001:3000` (Host:Container)
  - Host'tan: `http://localhost:4001`
  - Container içi: `http://0.0.0.0:3000`

### 2. Backend Tüm Ağ Arayüzlerinde Dinliyor
- **Dosya**: `backend/src/server.ts`
- Backend artık `0.0.0.0:3000` üzerinde dinliyor (container içi)

## ✅ Şimdi Yapmanız Gerekenler

### 1. Docker Container'ı Yeniden Başlatın

```bash
cd infra
docker-compose down
docker-compose up -d --build
```

Veya sadece backend'i yeniden başlatın:

```bash
cd infra
docker-compose restart backend
# veya
docker-compose up -d --build backend
```

### 2. Container'ın Çalıştığını Kontrol Edin

```bash
docker ps | findstr backend
# veya
docker ps | grep backend
```

Container'ın port mapping'ini kontrol edin:
```bash
docker port saas-tour-backend
# Beklenen: 3000/tcp -> 0.0.0.0:4001
```

### 3. Backend'in Erişilebilir Olduğunu Test Edin

**Host'tan:**
```bash
curl http://localhost:4001/health
# Beklenen: {"status":"ok"}
```

**Container içinden:**
```bash
docker exec saas-tour-backend curl http://localhost:3000/health
# Beklenen: {"status":"ok"}
```

### 4. Mobil Uygulamayı Test Edin

```bash
cd mobile
npm start
```

Login ekranında email ve password girin. Artık bağlantı çalışmalı.

## 🔍 Sorun Devam Ederse

### Container Log'larını Kontrol Edin

```bash
docker logs saas-tour-backend -f
```

Backend log'larında şunu görmelisiniz:
```
API running on port 3000 (0.0.0.0:3000)
```

### Port Mapping'i Kontrol Edin

```bash
# Windows PowerShell
netstat -an | findstr 4001
# Beklenen: LISTENING durumunda olmalı

# Linux/Mac
netstat -an | grep 4001
# veya
ss -tulpn | grep 4001
```

### Docker Network Kontrolü

```bash
# Container'ın network'lerini kontrol edin
docker inspect saas-tour-backend | findstr NetworkMode
# veya
docker inspect saas-tour-backend | grep NetworkMode
```

## 📝 Docker Compose Değişiklikleri

`infra/docker-compose.yml` dosyasına eklenen:

```yaml
ports:
  # Expose backend port for direct access (mobile app, local development)
  # Host:Container port mapping - allows access from host machine and emulators
  - "${BACKEND_PORT:-4001}:3000"
```

Bu sayede:
- Host'tan `http://localhost:4001` erişilebilir
- Android emülatör `http://10.0.2.2:4001` erişebilir
- Fiziksel cihaz `http://192.168.1.180:4001` erişebilir

## 🚀 Hızlı Test

```bash
# 1. Container'ı yeniden başlat
cd infra
docker-compose restart backend

# 2. Port mapping'i kontrol et
docker port saas-tour-backend

# 3. Health check
curl http://localhost:4001/health

# 4. Mobil uygulamayı test et
cd mobile
npm start
```

## 🔒 Notlar

- **Container içi port**: 3000 (değiştirilmemeli)
- **Host port**: 4001 (BACKEND_PORT environment variable ile değiştirilebilir)
- **Backend dinleme adresi**: 0.0.0.0:3000 (tüm ağ arayüzleri)
- **Traefik**: Hala çalışıyor, port mapping ek bir erişim yolu

## 🐛 Yaygın Hatalar

### Port Zaten Kullanımda

```bash
# Port'u kullanan process'i bulun
netstat -ano | findstr :4001
# Windows'ta process ID'yi bulun ve durdurun
```

### Container Başlamıyor

```bash
# Log'ları kontrol edin
docker logs saas-tour-backend

# Container'ı yeniden oluşturun
docker-compose up -d --force-recreate backend
```

### Network Bağlantı Sorunu

```bash
# Network'leri kontrol edin
docker network ls
docker network inspect saas_tour_internal
```

