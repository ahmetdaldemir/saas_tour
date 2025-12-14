# Sunucuda node_modules Sorunu Çözümü

## Sorun
Sunucuda `esbuild` binary'si çalışmıyor çünkü `node_modules` macOS'ta kurulmuş ve Linux'ta çalışmıyor.

## Hızlı Çözüm

Sunucuda aşağıdaki komutları çalıştırın:

```bash
ssh root@185.209.228.189
cd /var/www/html/saastour360

# Frontend node_modules'i sil
rm -rf frontend/node_modules

# Backend node_modules'i sil
rm -rf backend/node_modules

# Docker ile rebuild yap (Dockerfile içinde npm install yapılacak)
cd infra
docker-compose down
docker-compose up -d --build
```

## Alternatif: Deploy Script ile

```bash
ssh root@185.209.228.189
cd /var/www/html/saastour360
./deploy.sh infra
```

Bu komut:
1. `node_modules` klasörlerini temizler
2. Docker container'ları rebuild eder (Dockerfile içinde doğru platform için npm install yapılır)

## Önlem

- `.dockerignore` dosyaları eklendi - Artık Docker build sırasında `node_modules` kopyalanmayacak
- `deploy.sh` script'i güncellendi - `infra` modunda otomatik olarak `node_modules` temizleniyor

## Not

Docker kullanıldığı için sunucuda `node_modules` olmasına gerek yok. Her şey container içinde build ediliyor.

