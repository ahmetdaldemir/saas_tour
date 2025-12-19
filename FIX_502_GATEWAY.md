# 502 Bad Gateway Sorunu - Çözüm

## Sorun

Sunucuda 502 Bad Gateway hatası alınıyor. Traefik backend container'ına erişemiyor.

## Tespit Edilen Sorunlar

1. **Network Bağlantısı Eksik**: Backend ve Frontend container'ları `web` network'üne bağlı değil
   - Backend sadece `global_databases_network` network'ünde
   - Traefik `web` network'ünde
   - Container'lar farklı network'lerde olduğu için birbirlerine erişemiyorlar

2. **Docker Compose Network Yapılandırması**: `infra/docker-compose.yml` dosyasında `web` network tanımı var ama container'lar bağlanmamış

## Çözüm

### Geçici Çözüm (Manuel)

```bash
# Sunucuya bağlan
ssh root@185.209.228.189

# Backend container'ını web network'üne bağla
docker network connect web saas-tour-backend

# Frontend container'ını web network'üne bağla
docker network connect web saas-tour-frontend

# Traefik'i yeniden başlat (yeni network bağlantılarını görmesi için)
docker restart traefik
```

### Kalıcı Çözüm

`infra/docker-compose.yml` dosyası zaten doğru yapılandırılmış (`web` network tanımlı), ancak container'lar yeniden oluşturulurken network bağlantıları kaybolmuş olabilir.

**Çözüm**: Container'ları yeniden oluştur:

```bash
cd /var/www/html/saastour360/infra
docker-compose down
docker-compose up -d
```

Veya deployment script'i çalıştır:

```bash
cd /var/www/html/saastour360
./deploy.sh full
```

## Kontrol Komutları

### Network Bağlantılarını Kontrol Et

```bash
# Backend network'lerini kontrol et
docker inspect saas-tour-backend | grep -A 30 Networks

# Traefik network'lerini kontrol et
docker inspect traefik | grep -A 30 Networks

# Web network'ündeki container'ları listele
docker network inspect web | grep -A 5 Containers
```

### Bağlantı Testi

```bash
# Traefik'ten backend'e erişim testi
docker exec traefik wget -qO- http://saas-tour-backend:3000/api/auth/login

# Backend'in kendi içinde çalıştığını test et
docker exec saas-tour-backend wget -qO- http://localhost:3000/api/auth/login
```

## Önleme

Gelecekte bu sorunun tekrar oluşmaması için:

1. `deploy.sh` script'i container'ları yeniden oluştururken network bağlantılarını korur
2. Docker Compose otomatik olarak `networks` bölümünde tanımlı network'lere bağlar
3. Manuel `docker network connect` komutları sadece geçici çözüm için kullanılmalı

## Notlar

- Backend port: `3000` (internal)
- Frontend port: `80` (internal)
- Traefik entrypoints: `web` (80) ve `websecure` (443)
- Production'da Traefik portları: `5001` (HTTP) ve `5443` (HTTPS)

