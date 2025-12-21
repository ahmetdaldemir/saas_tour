# Production Migration Guide - Destinations tenant_id

## Sorun
Production sunucusunda `destinations` tablosuna `tenant_id` kolonu eklenirken hata alınıyor:
```
QueryFailedError: column "tenant_id" of relation "destinations" contains null values
```

## Çözüm Adımları

### 1. Entity'yi Geçici Olarak Nullable Yap
Entity şu anda nullable olarak ayarlandı. Bu sayede synchronize çalıştığında kolon nullable olarak eklenecek.

### 2. Production'da Synchronize Çalıştır
```bash
# Backend container'ı yeniden başlat (DB_SYNC=true ile)
# Kolon nullable olarak eklenecek
```

### 3. Script ile Verileri Güncelle ve NOT NULL Yap
```bash
# Production sunucusunda:
cd /var/www/html/saastour360/backend
npm run fix:destinations-tenant-sync
```

Bu script:
- NULL değerleri güncelleyecek
- Kolonu NOT NULL yapacak
- Foreign key constraint ekleyecek

### 4. Entity'yi Tekrar NOT NULL Yap
Script başarıyla çalıştıktan sonra, entity'yi tekrar NOT NULL yapın:

```typescript
@Column({ name: 'tenant_id', nullable: false })
tenantId!: string;
```

### 5. Son Kontrol
```bash
# Veritabanında kontrol:
docker exec global_postgres psql -U dev_user -d tour_saas -c "\d destinations"
```

## Alternatif: Manuel SQL

Eğer script çalışmazsa, manuel SQL:

```sql
-- 1. Kolonu nullable olarak ekle (eğer yoksa)
ALTER TABLE destinations ADD COLUMN tenant_id uuid;

-- 2. NULL değerleri güncelle
UPDATE destinations 
SET tenant_id = '30119880-b233-4896-b612-1463e32617f2' 
WHERE tenant_id IS NULL;

-- 3. NOT NULL yap
ALTER TABLE destinations ALTER COLUMN tenant_id SET NOT NULL;

-- 4. Foreign key ekle
ALTER TABLE destinations 
ADD CONSTRAINT FK_destinations_tenant_id 
FOREIGN KEY (tenant_id) 
REFERENCES tenants(id) 
ON DELETE CASCADE;
```

