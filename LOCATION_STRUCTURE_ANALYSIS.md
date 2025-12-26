# Locations ve Rentacar_Locations Yapı Analizi

## Genel Bakış

Sistem iki seviyeli bir location yapısı kullanıyor:

1. **`locations` (MasterLocation)** - Global master location'lar (tenant'a bağlı değil)
2. **`rentacar_locations` (Location)** - Tenant-specific location mapping'leri

---

## 1. `locations` Tablosu (MasterLocation Entity)

### Amaç
Global master location listesi. Tüm tenant'lar için ortak, tenant'a bağlı değil.

### Tablo Yapısı

```sql
CREATE TABLE locations (
  id UUID PRIMARY KEY,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  name VARCHAR(200) NOT NULL,          -- Lokasyon adı (örn: "İstanbul", "İstanbul Havalimanı")
  parent_id UUID NULL,                  -- Parent location ID (hiyerarşik yapı için)
  type ENUM('merkez', 'otel', 'havalimani', 'adres') DEFAULT 'merkez'
);

-- Foreign Key
FOREIGN KEY (parent_id) REFERENCES locations(id)

-- Indexes
INDEX (parent_id)
INDEX (type)
```

### Entity Yapısı

```typescript
@Entity({ name: 'locations' })
export class MasterLocation extends BaseEntity {
  name: string;                        // Lokasyon adı
  parentId?: string | null;            // Parent location ID
  parent?: MasterLocation | null;      // Parent relation
  children!: MasterLocation[];         // Children relation
  type: MasterLocationType;            // Lokasyon tipi
}
```

### Özellikler

- ✅ Tenant'a bağlı değil (global)
- ✅ Hiyerarşik yapı destekler (parent-child)
- ✅ Self-referencing (kendi kendine referans)
- ✅ Type enum: merkez, otel, havalimani, adres

### Örnek Veri

```
İstanbul (merkez, parent_id: null)
  ├── İstanbul Otel (otel, parent_id: İstanbul)
  ├── İstanbul Havalimanı (havalimani, parent_id: İstanbul)
  └── İstanbul Merkez (merkez, parent_id: İstanbul)
```

---

## 2. `rentacar_locations` Tablosu (Location Entity)

### Amaç
Tenant'ların master location'lara mapping'leri ve tenant-specific ayarları.

### Tablo Yapısı

```sql
CREATE TABLE rentacar_locations (
  id UUID PRIMARY KEY,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  tenant_id UUID NOT NULL,              -- Hangi tenant'a ait
  location_id UUID NOT NULL,            -- Hangi master location'a map edilmiş
  meta_title VARCHAR(200) NULL,         -- SEO için meta title
  sort INT DEFAULT 0,                   -- Sıralama
  delivery_fee DECIMAL(10,2) DEFAULT 0, -- Teslimat ücreti
  drop_fee DECIMAL(10,2) DEFAULT 0,     -- Bırakma ücreti
  min_day_count INT NULL,               -- Minimum gün sayısı
  is_active BOOLEAN DEFAULT true        -- Aktif/Pasif
);

-- Foreign Keys
FOREIGN KEY (tenant_id) REFERENCES tenants(id)
FOREIGN KEY (location_id) REFERENCES locations(id)

-- Indexes
INDEX (tenant_id, location_id)
UNIQUE (tenant_id, location_id)  -- Bir tenant için aynı location'ı birden fazla ekleyemez
```

### Entity Yapısı

```typescript
@Entity({ name: 'rentacar_locations' })
export class Location extends BaseEntity {
  tenantId: string;                    // Tenant ID
  tenant!: Tenant;                     // Tenant relation
  locationId: string;                  // Master location ID
  location!: MasterLocation;           // Master location relation
  metaTitle?: string;                  // SEO meta title
  sort: number;                        // Sıralama
  deliveryFee: number;                 // Teslimat ücreti
  dropFee: number;                     // Bırakma ücreti
  minDayCount?: number;                // Minimum gün sayısı
  isActive: boolean;                   // Aktif/Pasif
}
```

### Özellikler

- ✅ Tenant-specific mapping
- ✅ Master location'a referans (location_id)
- ✅ Tenant'a özel ayarlar (meta_title, fees, sort, vb.)
- ✅ Unique constraint: Bir tenant için aynı master location'ı birden fazla kez map edemez

---

## İlişki Yapısı

```
┌─────────────────┐
│   locations     │  (Master - Global)
│   (Master)      │
└────────┬────────┘
         │
         │ location_id (ManyToOne)
         │
         ▼
┌─────────────────────────┐
│  rentacar_locations     │  (Tenant-specific mapping)
│  (Location)             │
└────────┬────────────────┘
         │
         │ tenant_id (ManyToOne)
         │
         ▼
┌─────────────────┐
│    tenants      │
└─────────────────┘
```

---

## Kullanım Senaryosu

### Senaryo: "İstanbul Havalimanı" Location'ı Eklemek

1. **Master Location Kontrolü**:
   - "İstanbul Havalimanı" master location'ı `locations` tablosunda var mı?
   - Yoksa oluşturulmalı (admin tarafından)

2. **Parent Chain Kontrolü**:
   - "İstanbul Havalimanı" → parent: "İstanbul"
   - "İstanbul" → parent: null (top-level)

3. **Tenant Mapping Ekleme** (`LocationService.create`):
   ```
   User seçer: "İstanbul Havalimanı" (child location)
   
   LocationService.create otomatik olarak ekler:
   ✅ "İstanbul" (parent) → rentacar_locations
   ✅ "İstanbul Havalimanı" (seçilen) → rentacar_locations
   ```

4. **Sonuç**:
   - `rentacar_locations` tablosunda 2 kayıt:
     - İstanbul (parent, otomatik eklendi)
     - İstanbul Havalimanı (seçilen, kullanıcı ayarları ile)

---

## Service Mantığı

### `LocationService.create`

```typescript
1. Master location'ı bul
2. Parent chain'i oluştur (root'a kadar)
3. Her parent için rentacar_locations'a kayıt ekle:
   - Parent'lar: Varsayılan değerlerle (active: true, fees: 0)
   - Seçilen: Kullanıcı girdiği değerlerle
4. Cache'i temizle
```

### `LocationService.list`

```typescript
1. Tenant'ın tüm rentacar_locations kayıtlarını al
2. Master location'ları al (hierarchy ile)
3. Mapped location'ların parent'larını bul
4. Master location + Tenant mapping kombinasyonu oluştur
5. Children'ları hiyerarşik olarak ekle
6. Cache'e kaydet
```

---

## Frontend Yapısı

### LocationDto (API Response)

```typescript
{
  id: string;                    // rentacar_locations.id
  tenantId: string;
  locationId: string;            // locations.id (master)
  location: {                    // Master location bilgisi
    id: string;
    name: string;
    type: 'merkez' | 'otel' | 'havalimani' | 'adres';
    parentId?: string | null;
    parent?: MasterLocationDto | null;
    children?: MasterLocationDto[];
  };
  name: string;                  // location.name (master'dan)
  type: string;                  // location.type (master'dan)
  metaTitle?: string;            // Tenant-specific
  sort: number;                  // Tenant-specific
  deliveryFee: number;           // Tenant-specific
  dropFee: number;               // Tenant-specific
  minDayCount?: number;          // Tenant-specific
  isActive: boolean;             // Tenant-specific
  children?: LocationDto[];      // Nested children
  drops?: LocationDeliveryPricingDto[];
}
```

---

## Sorunlar ve Çözümler

### Sorun 1: Parent Location'lar Görünmüyor
**Neden**: `LocationService.list` sadece mapped location'ları gösteriyordu, parent chain'i eklenmemişti.

**Çözüm**: `LocationService.create` parent chain'i otomatik ekliyor. `list` metodu da parent'ları dahil edecek şekilde güncellendi.

### Sorun 2: Production'da Tablo Eksik
**Neden**: `locations` tablosu production'da oluşturulmamış.

**Çözüm**: `DB_SYNC=true` ile backend restart edilmeli veya manuel SQL ile oluşturulmalı.

### Sorun 3: location_id Kolonu Eksik
**Neden**: Eski yapıda `master_location_id` kullanılıyordu, yeni yapıda `location_id`.

**Çözüm**: Migration script'i ile kolon eklendi ve veri migrate edildi.

---

## Best Practices

1. ✅ **Master Location'ları Admin Yönetir**: Master location'lar global'dir, admin tarafından yönetilir.

2. ✅ **Tenant Location'ları Tenant Yönetir**: Tenant'lar master location'ları seçer ve kendi ayarlarını yapar.

3. ✅ **Parent Chain Otomatik**: Child location seçildiğinde parent'lar otomatik eklenir.

4. ✅ **Unique Constraint**: Bir tenant için aynı master location birden fazla kez map edilemez.

5. ✅ **Cache Kullanımı**: Redis cache ile performans artırılır (opsiyonel, Redis yoksa graceful degradation).

---

## Veritabanı Şeması Özeti

### locations (Master)
```
- id (PK)
- name
- parent_id (FK → locations.id)
- type (enum)
- created_at
- updated_at
```

### rentacar_locations (Tenant Mapping)
```
- id (PK)
- tenant_id (FK → tenants.id)
- location_id (FK → locations.id)
- meta_title
- sort
- delivery_fee
- drop_fee
- min_day_count
- is_active
- created_at
- updated_at

UNIQUE (tenant_id, location_id)
INDEX (tenant_id, location_id)
```

---

## API Endpoints

### Master Locations (Public)
- `GET /api/master-locations` - List all master locations
- `GET /api/master-locations/:id` - Get master location by ID
- `POST /api/master-locations` - Create master location (admin)
- `PUT /api/master-locations/:id` - Update master location (admin)
- `DELETE /api/master-locations/:id` - Delete master location (admin)

### Tenant Locations (Authenticated)
- `GET /api/rentacar/locations?tenantId=xxx` - List tenant locations
- `POST /api/rentacar/locations` - Create tenant location mapping
- `PUT /api/rentacar/locations/:id` - Update tenant location
- `DELETE /api/rentacar/locations/:id` - Delete tenant location (soft delete: isActive=false)

