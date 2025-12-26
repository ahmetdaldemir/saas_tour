# Lokalden Sunucu Veritabanına Bağlantı Sorunları ve Çözümleri

## Olası Nedenler

### 1. PostgreSQL External Port Expose Edilmemiş
PostgreSQL container'ı sadece Docker network içinde çalışıyor olabilir.

**Çözüm:** Sunucuda PostgreSQL container'ının port'unu expose etmek gerekiyor.

### 2. PostgreSQL pg_hba.conf Ayarları
PostgreSQL remote bağlantılara izin vermiyor olabilir.

**Çözüm:** `pg_hba.conf` dosyasında remote IP'lere izin verilmeli.

### 3. PostgreSQL listen_addresses Ayarı
PostgreSQL sadece localhost'tan bağlantı kabul ediyor olabilir.

**Çözüm:** `postgresql.conf` dosyasında `listen_addresses = '*'` olmalı.

### 4. Firewall Kuralları
Sunucu firewall'u 5432 portunu blokluyor olabilir.

**Çözüm:** Firewall'da 5432 portunu açmak gerekiyor.

### 5. Yanlış Bağlantı Bilgileri
DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD yanlış olabilir.

## Kontrol Adımları

### Sunucuda Kontrol:

```bash
# 1. PostgreSQL container'ının port'unu kontrol et
docker ps | grep postgres

# 2. PostgreSQL loglarını kontrol et
docker logs global_postgres | tail -50

# 3. PostgreSQL container'ına bağlan ve ayarları kontrol et
docker exec -it global_postgres psql -U dev_user -d tour_saas
```

### PostgreSQL Ayarlarını Kontrol:

```bash
# PostgreSQL container'ına gir
docker exec -it global_postgres bash

# postgresql.conf dosyasını kontrol et
cat /var/lib/postgresql/data/postgresql.conf | grep listen_addresses

# pg_hba.conf dosyasını kontrol et
cat /var/lib/postgresql/data/pg_hba.conf
```

## Çözüm: PostgreSQL'i External Port'a Expose Et

### Yöntem 1: Docker Compose'da Port Mapping Ekle

Sunucuda `global_postgres` container'ının bulunduğu docker-compose.yml dosyasını bul ve:

```yaml
services:
  global_postgres:
    image: postgres:15
    ports:
      - "5432:5432"  # Host:Container port mapping
    # ... diğer ayarlar
```

### Yöntem 2: PostgreSQL'i Remote Bağlantılara Aç

PostgreSQL container'ına gir ve ayarları yap:

```bash
# Container'a gir
docker exec -it global_postgres bash

# postgresql.conf dosyasını düzenle
echo "listen_addresses = '*'" >> /var/lib/postgresql/data/postgresql.conf

# pg_hba.conf dosyasına remote bağlantı izni ekle
echo "host    all    all    0.0.0.0/0    md5" >> /var/lib/postgresql/data/pg_hba.conf

# PostgreSQL'i restart et
# Container'dan çık ve:
docker restart global_postgres
```

### Yöntem 3: Firewall Kurallarını Kontrol Et

```bash
# UFW kullanıyorsanız:
sudo ufw allow 5432/tcp
sudo ufw reload

# iptables kullanıyorsanız:
sudo iptables -A INPUT -p tcp --dport 5432 -j ACCEPT
sudo iptables-save
```

### Yöntem 4: SSH Tunneling Kullan (Güvenli Alternatif)

Lokal makineden:

```bash
# SSH tunnel oluştur (5432 portu yerel olarak forward edilir)
ssh -L 5432:localhost:5432 root@185.209.228.189

# Başka terminal'de lokal .env dosyasında:
# DB_HOST=localhost
# DB_PORT=5432
```

## Lokal .env Dosyası Ayarları

Lokalden bağlanmak için `backend/.env` dosyasında:

```env
# Sunucu IP veya domain
DB_HOST=185.209.228.189  # veya sunucu domain adresi
DB_PORT=5432
DB_USERNAME=dev_user
DB_PASSWORD=dev_pass  # Gerçek şifre
DB_NAME=tour_saas
```

## Test Bağlantısı

```bash
# Lokalden test et
psql -h 185.209.228.189 -p 5432 -U dev_user -d tour_saas

# Veya TypeScript ile test:
cd backend
npm run build
node -e "require('./dist/config/data-source').AppDataSource.initialize().then(() => console.log('✅ Connected')).catch(e => console.error('❌ Error:', e.message))"
```

