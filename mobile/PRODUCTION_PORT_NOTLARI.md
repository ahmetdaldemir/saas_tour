# Production Port Yapılandırması

## ✅ Production'da Port Çakışması OLMAYACAK

### Mevcut Durum

**Production Ortamı:**
- **Traefik**: Port 5001 (HTTP) ve 5443 (HTTPS) üzerinden çalışıyor
- **Backend**: Traefik üzerinden erişiliyor, direkt port erişimi YOK
- **Frontend**: Traefik üzerinden erişiliyor, direkt port erişimi YOK

**Local Development:**
- **Backend Port Mapping**: `docker-compose.override.yml` dosyası ile aktif
- **Port**: 4001 (environment variable ile değiştirilebilir)

## 🔧 Yapılan Düzeltme

### Port Mapping Sadece Local Development İçin

Docker Compose yapılandırması:

1. **`docker-compose.yml`** (Production + Development):
   - Port mapping YOK
   - Traefik üzerinden erişim

2. **`docker-compose.override.yml`** (Sadece Local Development):
   - Port mapping VAR: `4001:3000`
   - Bu dosya production'da olmamalı

### Nasıl Çalışıyor?

1. **Production'da**:
   - `docker-compose.override.yml` dosyası YOK
   - Port mapping YOK → Port çakışması yok ✅
   - Traefik üzerinden erişim devam ediyor

2. **Local Development'da**:
   - `docker-compose.override.yml` dosyası VAR
   - Port mapping VAR → `4001:3000`
   - Mobil uygulama test edilebilir

## 📝 Kullanım

### Production Deployment

```bash
cd infra
# docker-compose.override.yml dosyasını silin veya yok sayın
# Port mapping olmaz, sadece Traefik üzerinden erişim
docker-compose up -d
```

**ÖNEMLİ:** Production'da `docker-compose.override.yml` dosyası olmamalı!

### Local Development (Mobil Uygulama Test)

```bash
cd infra
# docker-compose.override.yml zaten var (port mapping ile)
docker-compose up -d
```

Veya manuel olarak oluşturun:

```bash
cd infra
cp docker-compose.override.yml.example docker-compose.override.yml
docker-compose up -d
```

## 🔍 Port Kullanımı

### Production (Canlı Sunucu)

| Servis | Port | Erişim |
|--------|------|--------|
| Traefik HTTP | 5001 | `http://sunset.saastour360.com:5001` |
| Traefik HTTPS | 5443 | `https://sunset.saastour360.com` |
| Backend | - | Traefik üzerinden (port mapping YOK) |
| Frontend | - | Traefik üzerinden (port mapping YOK) |

### Local Development

| Servis | Port | Erişim |
|--------|------|--------|
| Traefik HTTP | 5001 | `http://localhost:5001` |
| Backend (override) | 4001 | `http://localhost:4001` (docker-compose.override.yml ile) |
| Frontend | - | Traefik üzerinden |

## ✅ Sonuç

- **Production'da**: `docker-compose.override.yml` YOK → Port mapping YOK → Port çakışması yok ✅
- **Local Development'da**: `docker-compose.override.yml` VAR → Port mapping VAR → Mobil uygulama test edilebilir ✅
- **Traefik**: Her iki ortamda da çalışıyor ✅

## 🚀 Deployment Checklist

### Production Deployment

```bash
# 1. docker-compose.override.yml dosyasını kontrol et (olmamalı)
cd infra
ls docker-compose.override.yml
# Eğer varsa: rm docker-compose.override.yml

# 2. Container'ı başlat (port mapping olmaz)
docker-compose up -d --build

# 3. Port mapping olmadığını kontrol et
docker port saas-tour-backend
# Beklenen: (boş - port mapping yok)

# 4. Traefik üzerinden erişimi test et
curl https://api.saastour360.com/api/health
```

### Local Development

```bash
# 1. docker-compose.override.yml dosyasının var olduğunu kontrol et
cd infra
ls docker-compose.override.yml
# Eğer yoksa: cp docker-compose.override.yml.example docker-compose.override.yml

# 2. Container'ı başlat (port mapping ile)
docker-compose up -d --build

# 3. Port mapping'i kontrol et
docker port saas-tour-backend
# Beklenen: 3000/tcp -> 0.0.0.0:4001

# 4. Direkt erişimi test et
curl http://localhost:4001/health
```

## 📌 Önemli Notlar

1. **Production'da `docker-compose.override.yml` OLMAMALI** → Port çakışması yok ✅
2. **Local development'da `docker-compose.override.yml` VAR** → Port mapping ile mobil uygulama test edilebilir ✅
3. **Traefik her iki ortamda da çalışıyor** → Production erişimi etkilenmiyor ✅
4. **Port 4001 ve 5001** production'da kullanılıyor ama backend container'ı bu portları expose etmiyor ✅

## 🔒 Güvenlik

- Production'da direkt port erişimi YOK → Daha güvenli
- Sadece Traefik üzerinden erişim → SSL/TLS ve rate limiting Traefik'te yapılıyor
- Local development için port mapping sadece local'de aktif
