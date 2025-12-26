# Production Ortamında Location Ekleme Rehberi

## Önkoşullar

1. `locations` tablosu oluşturulmuş olmalı
2. Backend container'ı çalışıyor olmalı

## Yöntem 1: Seed Scriptleri ile (Önerilen - Toplu Ekleme)

### 1.1. Master Location'ları Ekle (Türkiye İlleri)

Production container'ından çalıştır:

```bash
# Backend container'ına gir
docker exec -it saas-tour-backend sh

# Master location'ları ekle (81 il)
npm run seed:provinces

# Bu script:
# - locations (master) tablosuna 81 ili ekler
# - İlk tenant için rentacar_locations tablosuna mapping oluşturur
```

### 1.2. Alt Location'ları Ekle (Otel, Havalimanı, Merkez)

```bash
# Backend container'ından
npm run seed:province-sub-locations

# Bu script:
# - Her il için: "{İl} Otel", "{İl} Havalimanı", "{İl} Merkez" ekler
# - Sadece locations (master) tablosuna ekler
# - Tenant mapping yapmaz (tenant'lar istediği location'ı seçebilir)
```

## Yöntem 2: API Üzerinden Manuel Ekleme

### 2.1. Master Location Ekle

```bash
# API endpoint: POST /api/master-locations
# Authentication gerekli

curl -X POST https://your-domain.com/api/master-locations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "İstanbul",
    "parentId": null,
    "type": "merkez"
  }'
```

### 2.2. Tenant Location Mapping Ekle

Frontend üzerinden:
1. Rentacar → Lokasyonlar sekmesine git
2. "Lokasyon Ekle" butonuna tıkla
3. Master location seç
4. Diğer bilgileri doldur (meta title, fees, vb.)
5. Kaydet

## Yöntem 3: Veritabanından Direkt Ekleme (Gelişmiş)

### 3.1. Master Location Ekle

```bash
# PostgreSQL container'ına gir
docker exec -it global_postgres psql -U dev_user -d tour_saas

# SQL ile ekle
INSERT INTO locations (id, name, parent_id, type, created_at, updated_at)
VALUES (
  uuid_generate_v4(),
  'İstanbul',
  NULL,
  'merkez',
  NOW(),
  NOW()
);
```

### 3.2. Tenant Location Mapping Ekle

```bash
# Tenant ID'yi öğren
SELECT id, name FROM tenants;

# Tenant location mapping ekle
INSERT INTO rentacar_locations (
  id, tenant_id, location_id, meta_title, 
  sort, delivery_fee, drop_fee, is_active, 
  created_at, updated_at
)
VALUES (
  uuid_generate_v4(),
  'YOUR_TENANT_ID',
  'YOUR_LOCATION_ID',
  'İstanbul Araç Kiralama',
  0,
  0.00,
  0.00,
  true,
  NOW(),
  NOW()
);
```

## Adım Adım Production Kurulumu

### 1. locations Tablosunu Kontrol Et

```bash
docker exec -it saas-tour-backend npm run check:locations
```

### 2. Eğer Tablo Yoksa, Oluştur

```bash
# DB_SYNC=true yap ve restart et
docker exec -it saas-tour-backend sh
echo "DB_SYNC=true" >> .env  # Veya manuel SQL ile oluştur

# Container'dan çık ve restart et
cd /var/www/html/saastour360/infra
docker-compose restart backend
```

### 3. Master Location'ları Ekle

```bash
docker exec -it saas-tour-backend npm run seed:provinces
```

### 4. Alt Location'ları Ekle

```bash
docker exec -it saas-tour-backend npm run seed:province-sub-locations
```

### 5. Kontrol Et

```bash
# Master location sayısını kontrol et
docker exec -it global_postgres psql -U dev_user -d tour_saas \
  -c "SELECT COUNT(*) FROM locations;"

# Tenant location mapping sayısını kontrol et
docker exec -it global_postgres psql -U dev_user -d tour_saas \
  -c "SELECT COUNT(*) FROM rentacar_locations;"
```

## Önemli Notlar

1. **Master Location'lar Global'dir**: `locations` tablosundaki location'lar tüm tenant'lar için ortaktır.

2. **Tenant Mapping**: Her tenant istediği master location'ı seçip kendi ayarlarını yapabilir.

3. **Parent Chain**: Bir child location seçildiğinde, otomatik olarak parent'ları da `rentacar_locations` tablosuna eklenir.

4. **Seed Scriptleri**: 
   - `seed:provinces` → 81 il + ilk tenant için mapping
   - `seed:province-sub-locations` → Alt location'lar (sadece master)

5. **API Endpoints**:
   - `GET /api/master-locations` → Master location'ları listele
   - `POST /api/master-locations` → Master location ekle (admin)
   - `GET /api/rentacar/locations` → Tenant location'ları listele
   - `POST /api/rentacar/locations` → Tenant location ekle (authenticated)

## Sorun Giderme

### Tablo Bulunamıyor Hatası

```bash
# locations tablosunu kontrol et
docker exec -it global_postgres psql -U dev_user -d tour_saas \
  -c "\dt locations"

# Yoksa manuel oluştur (SQL script'i kullan)
```

### Seed Script Çalışmıyor

```bash
# Backend container loglarını kontrol et
docker logs saas-tour-backend | tail -50

# Container içinde script'i direkt çalıştır
docker exec -it saas-tour-backend sh
npm run seed:provinces
```

