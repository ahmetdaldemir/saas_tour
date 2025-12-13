# 🌱 Database Seed Kılavuzu

## Seed Çalıştırma Yöntemleri

### 1. Deploy Script ile (Önerilen - Sunucuda)

```bash
# Ana seed (tenants, users, languages, vb.)
./deploy.sh seed

# Global destinations ve hotels seed
./deploy.sh seed:global
```

### 2. Docker Container İçinden (Sunucuda)

```bash
# Ana seed
docker exec -it saas-tour-backend node dist/seeds/seed.js

# Global destinations/hotels seed
docker exec -it saas-tour-backend node dist/scripts/seed-global-destinations-hotels.js
```

### 3. Local Development

```bash
cd backend
npm run seed              # Ana seed
npm run seed:global       # Global destinations/hotels seed
```

## Seed İçerikleri

### Ana Seed (`seed`)

- **Languages**: English, Türkçe, Deutsch
- **Phone Countries**: TR, US, DE
- **Tenants**: 
  - Blue Travel (TOUR)
  - Berg Rentals (RENTACAR)
- **Tenant Users**: 
  - elif@bluetravel.com / Password123!
  - mert@swiftrentals.com / Password123!
- **Destinations**: Kapadokya Balon Turu
- **Tours**: Örnek tur paketleri
- **Payment Methods**: Çeşitli ödeme yöntemleri

### Global Seed (`seed:global`)

- Global destinations import
- Hotels import

## Önemli Notlar

1. **Seed'i çalıştırmadan önce:**
   - Database schema'nın oluşturulmuş olması gerekir
   - Backend container'ının çalışıyor olması gerekir

2. **Sunucuda seed çalıştırma:**
   ```bash
   # Önce container'ların çalıştığını kontrol et
   docker ps | grep saas-tour-backend
   
   # Seed çalıştır
   ./deploy.sh seed
   ```

3. **Seed idempotent'tir:**
   - Aynı seed'i birden fazla çalıştırabilirsiniz
   - Mevcut kayıtlar güncellenmez, sadece yeni kayıtlar eklenir

4. **Seed başarısız olursa:**
   ```bash
   # Logları kontrol et
   docker logs saas-tour-backend
   
   # Veya seed'i tekrar çalıştır
   ./deploy.sh seed
   ```

## Sorun Giderme

### Container Çalışmıyor

```bash
# Container'ı başlat
./deploy.sh build
```

### Database Bağlantı Hatası

```bash
# Database stack'in çalıştığını kontrol et
docker ps | grep global_postgres

# Backend .env dosyasını kontrol et
cat backend/.env | grep DB_
```

### Seed Script Bulunamıyor

Build edilmiş dosyaların olduğundan emin olun:
```bash
cd backend
npm run build
```

## Örnek Kullanım

### İlk Kurulum Sonrası Seed

```bash
# 1. Database ve container'ları başlat
./deploy.sh full

# 2. Seed çalıştır
./deploy.sh seed

# 3. Global destinations/hotels ekle (opsiyonel)
./deploy.sh seed:global
```

### Sunucuda Seed

```bash
# SSH ile sunucuya bağlan
ssh root@your-server

# Proje dizinine git
cd /var/www/html/saastour360

# Seed çalıştır
./deploy.sh seed
```

