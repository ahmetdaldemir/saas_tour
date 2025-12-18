# Backend Seed Komutları

Bu dokümanda backend'te çalıştırılabilecek tüm seed script'leri ve kullanım yöntemleri açıklanmaktadır.

## Yerel Ortamda Çalıştırma

### 1. Ana Seed Script (Temel veriler)
```bash
cd backend
npm run seed
```
veya
```bash
npm run seed:mock
```

### 2. Customer Welcome Email Template Seed
```bash
cd backend
npm run seed:customer-welcome
```
Tüm tenant'lar için Customer Welcome email template'lerini oluşturur (TR, EN ve Default).

### 3. Global Destinations ve Hotels Seed
```bash
cd backend
npm run seed:global
```

### 4. Destinations Import (RapidAPI)
```bash
cd backend
npm run import:destinations
```

### 5. Hotels Import (RapidAPI)
```bash
cd backend
npm run import:hotels
```

---

## Docker Container İçinde Çalıştırma

Backend container'ı çalışıyorsa, script'leri container içinde çalıştırabilirsiniz:

### 1. Ana Seed Script
```bash
docker exec -it saas-tour-backend node dist/seeds/seed.js
```

### 2. Customer Welcome Email Template Seed
```bash
docker exec -it saas-tour-backend node dist/scripts/seed-customer-welcome-template.js
```

### 3. Global Destinations ve Hotels Seed
```bash
docker exec -it saas-tour-backend node dist/scripts/seed-global-destinations-hotels.js
```

### 4. Mock Data Seed
```bash
docker exec -it saas-tour-backend node dist/scripts/seed-mock-data.js
```

---

## Deploy Script ile Çalıştırma

Proje root dizininde:

### Ana Seed
```bash
./deploy.sh seed
```

### Global Destinations/Hotels Seed
```bash
./deploy.sh seed:global
```

---

## Seed Script'leri

### 1. `src/seeds/seed.ts`
Ana seed script'i. Temel verileri oluşturur.

### 2. `src/scripts/seed-customer-welcome-template.ts`
Customer Welcome email template'lerini oluşturur:
- Türkçe template (language: tr)
- İngilizce template (language: en)
- Default template (language: null)

**Özellikler:**
- Mevcut tenant'ları otomatik bulur
- Her tenant için template'leri oluşturur
- Eğer template zaten varsa atlar
- Template içeriği şifre, müşteri bilgileri gibi değişkenler içerir

### 3. `src/scripts/seed-global-destinations-hotels.ts`
Global destinasyonlar ve otelleri seed eder.

### 4. `src/scripts/seed-mock-data.ts`
Test için mock data oluşturur (tours, reservations, customers, vb.).

### 5. `src/scripts/import-destinations.ts`
RapidAPI'den destinasyonları import eder.

### 6. `src/scripts/import-hotels.ts`
RapidAPI'den otelleri import eder.

---

## Önemli Notlar

1. **Build Gerekli**: Docker container içinde çalıştırmadan önce backend'in build edilmiş olması gerekir:
   ```bash
   cd infra
   docker-compose build backend
   ```

2. **Environment Variables**: Seed script'leri database bağlantısı için `.env` dosyasındaki ayarları kullanır.

3. **Idempotent**: Seed script'leri genellikle idempotent'tir (birden fazla kez çalıştırılabilir, mevcut kayıtları atlar).

4. **Tenant ID**: Bazı seed script'leri tenant ID gerektirebilir. Script içindeki kodları kontrol edin.

---

## Customer Welcome Template Değişkenleri

Template içinde kullanılabilir değişkenler:
- `{{customerName}}` - Müşteri tam adı
- `{{customerEmail}}` - E-posta adresi
- `{{password}}` - Açık şifre (test için)
- `{{customerPhone}}` - Telefon numarası
- `{{idNumber}}` - TC/Pasaport numarası
- `{{firstName}}` - Ad
- `{{lastName}}` - Soyad
- `{{birthDate}}` - Doğum tarihi
- `{{birthPlace}}` - Doğum yeri
- `{{gender}}` - Cinsiyet
- `{{country}}` - Ülke
- `{{licenseNumber}}` - Ehliyet numarası
- `{{licenseClass}}` - Ehliyet sınıfı

