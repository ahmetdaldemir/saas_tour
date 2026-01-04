# Docker Container Kullanımı - Mobil Uygulama

## ✅ Docker Container Çalışıyorsa `npm run dev` GEREKMEZ

### Mevcut Durum

Docker container'ınız çalışıyor:
- **Container**: `saas-tour-backend`
- **Port Mapping**: `4001:3000` (Host:Container)
- **Status**: Running
- **Erişim**: `http://localhost:4001`

### Neden Docker Container Kullanmalıyız?

1. **Zaten Çalışıyor**: Container hazır ve çalışıyor ✅
2. **Port Mapping Var**: `4001:3000` port mapping mevcut ✅
3. **Production'a Yakın**: Docker container production ortamına daha yakın
4. **Tutarlılık**: Aynı ortamda test ediyorsunuz
5. **Gereksiz Process**: `npm run dev` ayrı bir process başlatır, gereksiz

## 🚀 Mobil Uygulama Testi

### Docker Container ile (Önerilen)

```bash
# 1. Container'ın çalıştığını kontrol et
docker ps | grep backend

# 2. Port mapping'i kontrol et
docker port saas-tour-backend
# Beklenen: 3000/tcp -> 0.0.0.0:4001

# 3. Health check
curl http://localhost:4001/health

# 4. Mobil uygulamayı başlat
cd mobile
npm start
```

**Mobil uygulama zaten Docker container'a bağlanacak!** ✅

### npm run dev ile (Gereksiz)

```bash
# ❌ GEREKMEZ - Docker container zaten çalışıyor
cd backend
npm run dev
```

## 🔍 Kontrol Komutları

### Container Durumu

```bash
# Container'ın çalışıp çalışmadığını kontrol et
docker ps | grep backend

# Container log'larını görüntüle
docker logs saas-tour-backend -f

# Container'ı yeniden başlat (gerekirse)
docker restart saas-tour-backend
```

### Port Kontrolü

```bash
# Port mapping'i kontrol et
docker port saas-tour-backend
# Beklenen: 3000/tcp -> 0.0.0.0:4001

# Port'un dinlendiğini kontrol et
netstat -an | findstr 4001
# Windows'ta: LISTENING durumunda olmalı
```

### API Testi

```bash
# Health endpoint'i test et
curl http://localhost:4001/health
# Beklenen: {"status":"ok"}

# Login endpoint'i test et (örnek)
curl -X POST http://localhost:4001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'
```

## 📝 Mobil Uygulama Yapılandırması

Mobil uygulama zaten Docker container'a bağlanacak şekilde yapılandırılmış:

**`mobile/app.json`:**
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
- Otomatik olarak `10.0.2.2:4001` kullanılacak
- Docker container'ın port mapping'i üzerinden erişecek

## 🔄 Container'ı Güncelleme

### Kod Değişikliği Yaptıysanız

```bash
# 1. Container'ı yeniden build et
cd infra
docker-compose build backend

# 2. Container'ı yeniden başlat
docker-compose restart backend

# 3. Log'ları kontrol et
docker logs saas-tour-backend -f
```

### Tamamen Yeniden Başlatma

```bash
cd infra
docker-compose down
docker-compose up -d --build
```

## ✅ Avantajlar

### Docker Container Kullanmanın Avantajları

1. **Production'a Yakın**: Aynı ortamda test ediyorsunuz
2. **Tutarlılık**: Her zaman aynı ortam
3. **Kolay Yönetim**: Container'ı durdur/başlat kolay
4. **Log Yönetimi**: `docker logs` ile kolay log görüntüleme
5. **Port Yönetimi**: Port mapping otomatik

### npm run dev Kullanmanın Dezavantajları

1. **Gereksiz Process**: Ayrı bir Node.js process
2. **Port Çakışması**: Aynı port'u kullanabilir
3. **Farklı Ortam**: Local Node.js vs Docker container
4. **Yönetim Zorluğu**: İki ayrı process yönetmek

## 🚨 Sorun Giderme

### Container Çalışmıyor

```bash
# Container'ı başlat
cd infra
docker-compose up -d backend

# Log'ları kontrol et
docker logs saas-tour-backend
```

### Port Mapping Yok

```bash
# docker-compose.override.yml dosyasının var olduğunu kontrol et
cd infra
ls docker-compose.override.yml

# Yoksa oluştur
cp docker-compose.override.yml.example docker-compose.override.yml

# Container'ı yeniden başlat
docker-compose restart backend
```

### API Erişilemiyor

```bash
# Container'ın çalıştığını kontrol et
docker ps | grep backend

# Port mapping'i kontrol et
docker port saas-tour-backend

# Health check
curl http://localhost:4001/health

# Container log'larını kontrol et
docker logs saas-tour-backend -f
```

## 📌 Özet

- ✅ **Docker container çalışıyorsa `npm run dev` GEREKMEZ**
- ✅ **Mobil uygulama direkt Docker container'a bağlanacak**
- ✅ **Port mapping zaten var: `4001:3000`**
- ✅ **Container log'larını `docker logs` ile görüntüleyin**

## 🎯 Hızlı Başlangıç

```bash
# 1. Container'ın çalıştığını kontrol et
docker ps | grep backend

# 2. Mobil uygulamayı başlat
cd mobile
npm start

# 3. Login yap ve test et
# Mobil uygulama otomatik olarak Docker container'a bağlanacak
```

