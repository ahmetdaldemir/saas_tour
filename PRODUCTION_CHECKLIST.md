# Production Deployment Checklist - berg.saastour360.com

Bu doküman, production'a çıkmadan önce kontrol edilmesi gereken tüm ayarları içerir.

## ✅ 1. Database Volume Yapılandırması

### Kontrol: Database verileri kalıcı mı?

✅ **DOĞRU**: `docker-datatabse-stack/docker-compose.yml` dosyasında PostgreSQL volume yapılandırması mevcut:

```yaml
volumes:
  postgres_data:
    driver: local
```

✅ **DOĞRU**: `deploy.sh` script'i database verilerini koruyor:

- Normal mod: `docker-compose down` (volume'lar korunur)
- Fresh DB modu: `docker-compose down -v` (sadece `--fresh-db` ile)

**Sonuç**: ✅ Database verileri korunuyor

---

## ✅ 2. DB_SYNC Ayarları

### Kontrol: Production'da DB_SYNC=false olmalı

✅ **DOĞRU**: `deploy.sh` script'i otomatik olarak ayarlıyor:

- Normal mod: `DB_SYNC=false` (migration'lar kullanılır, veriler korunur)
- Fresh DB modu: `DB_SYNC=true` (sadece ilk kurulum için)

✅ **DOĞRU**: `infra/docker-compose.yml` dosyasında:
```yaml
environment:
  - DB_SYNC=true  # Bu satır deploy.sh tarafından override edilir
```

⚠️ **DİKKAT**: Production'da `backend/.env` dosyasında `DB_SYNC=false` olmalı!

**Kontrol komutu**:
```bash
# Sunucuda kontrol edin
cat backend/.env | grep DB_SYNC
# Çıktı: DB_SYNC=false olmalı
```

**Sonuç**: ✅ deploy.sh otomatik yönetiyor, ama production'da manuel kontrol edin

---

## ✅ 3. Traefik Port Ayarları

### Kontrol: Local vs Production port ayarları

❌ **SORUN**: `infra/traefik/docker-compose.yml` dosyasında portlar sabit kodlanmış:

**Şu anki (Local için):**
```yaml
ports:
  - "5001:80"    # Local development
  - "5443:443"   # Local development
```

**Production için gerekli:**
```yaml
ports:
  - "80:80"      # Production
  - "443:443"    # Production
```

### Çözüm: Environment Variable Kullanın

**Önerilen çözüm**: `infra/traefik/docker-compose.yml` dosyasını güncelleyin:

```yaml
ports:
  - "${TRAEFIK_HTTP_PORT:-5001}:80"
  - "${TRAEFIK_HTTPS_PORT:-5443}:443"
  - "8080:8080"
```

**Sunucuda**:
```bash
export TRAEFIK_HTTP_PORT=80
export TRAEFIK_HTTPS_PORT=443
cd infra/traefik
docker-compose up -d
```

**Veya** sunucuda dosyayı manuel olarak düzenleyin (SUNUCU_PRODUCTION_KURULUMU.md'deki gibi).

**Sonuç**: ⚠️ Sunucuda manuel port değişikliği gerekiyor

---

## ✅ 4. Environment Variables

### Backend .env Kontrol Listesi

Sunucuda `backend/.env` dosyasında şunlar olmalı:

```env
NODE_ENV=production
APP_PORT=3000
DB_HOST=global_postgres
DB_PORT=5432
DB_USERNAME=dev_user  # veya production username
DB_PASSWORD=dev_pass  # veya production password (güçlü olmalı!)
DB_NAME=tour_saas
DB_SYNC=false  # ⚠️ ÖNEMLİ: Production'da false olmalı!

# JWT
JWT_SECRET=<güçlü-secret-key>

# Diğer ayarlar...
```

### Database Stack .env Kontrol Listesi

Sunucuda `docker-datatabse-stack/.env` dosyasında şunlar olmalı:

```env
POSTGRES_USER=dev_user  # veya production username
POSTGRES_PASSWORD=dev_pass  # veya production password
POSTGRES_DB=tour_saas
```

**Sonuç**: ✅ Environment variable'lar doğru yapılandırılmış, sadece değerleri production'a göre güncelleyin

---

## ✅ 5. Network Yapılandırması

### Kontrol: Network'ler doğru yapılandırılmış mı?

✅ **DOĞRU**: Tüm network'ler external olarak tanımlanmış:

- `web` network: Traefik için (external)
- `global_databases_network`: Database için (external)
- `saas_tour_internal`: Internal iletişim için

✅ **DOĞRU**: `deploy.sh` script'i network'leri otomatik oluşturuyor:

```bash
# Web network kontrolü
if ! docker network ls | grep -q "web"; then
    docker network create web
fi

# Database network kontrolü
if ! docker network ls | grep -q "global_databases_network"; then
    cd docker-datatabse-stack
    docker-compose up -d
fi
```

**Sonuç**: ✅ Network yapılandırması doğru

---

## ✅ 6. Database Bağlantı Kontrolü

### Kontrol: Backend database'e bağlanabiliyor mu?

✅ **DOĞRU**: `infra/docker-compose.yml` dosyasında:

```yaml
environment:
  - DB_HOST=global_postgres  # ✅ Docker container name
  - DB_PORT=5432
  - DB_USERNAME=${DB_USERNAME:-dev_user}
  - DB_PASSWORD=${DB_PASSWORD:-dev_pass}
  - DB_NAME=${DB_NAME:-tour_saas}
```

✅ **DOĞRU**: Backend `global_databases_network` network'ünde:

```yaml
networks:
  - global_databases_network
```

**Sonuç**: ✅ Database bağlantı yapılandırması doğru

---

## ✅ 7. Deploy Script Database Koruma

### Kontrol: deploy.sh database verilerini koruyor mu?

✅ **DOĞRU**: `deploy.sh` script'i database verilerini koruyor:

```bash
# Normal mod (default)
if [ "$FRESH_DB" = "true" ]; then
    docker-compose down -v  # Volume'ları sil (fresh DB)
else
    docker-compose down     # Volume'ları koru ✅
fi
```

**Kullanım**:
```bash
./deploy.sh full          # ✅ Database verileri korunur
./deploy.sh infra         # ✅ Database verileri korunur
./deploy.sh --fresh-db    # ⚠️ Database verileri silinir (sadece ilk kurulum için)
```

**Sonuç**: ✅ Database verileri korunuyor

---

## ✅ 8. Container Restart Politikaları

### Kontrol: Container'lar otomatik restart ediyor mu?

✅ **DOĞRU**: Tüm önemli container'lar `restart: unless-stopped` kullanıyor:

- Backend: `restart: unless-stopped` ✅
- Frontend: `restart: unless-stopped` ✅
- Traefik: `restart: unless-stopped` ✅
- PostgreSQL: `restart: unless-stopped` ✅ (docker-datatabse-stack'te)

**Sonuç**: ✅ Container'lar otomatik restart ediyor

---

## ⚠️ 9. Production İçin Yapılması Gerekenler

### 9.1 Traefik Portları (Sunucuda)

**Sunucuda** `infra/traefik/docker-compose.yml` dosyasını düzenleyin:

```yaml
ports:
  - "80:80"      # 5001:80 yerine
  - "443:443"    # 5443:443 yerine
```

### 9.2 DB_SYNC Ayarı (Sunucuda)

**Sunucuda** `backend/.env` dosyasında:

```env
DB_SYNC=false  # Production'da mutlaka false olmalı!
```

### 9.3 Şifreler ve Secret'lar (Sunucuda)

**Sunucuda** güçlü şifreler kullanın:

```env
# backend/.env
JWT_SECRET=<güçlü-random-secret>
DB_PASSWORD=<güçlü-password>

# docker-datatabse-stack/.env
POSTGRES_PASSWORD=<güçlü-password>
```

### 9.4 DNS Ayarları

**Domain sağlayıcınızda** wildcard A record ekleyin:

```
Type: A
Name: *
Value: 185.209.228.189
TTL: 3600
```

---

## 📋 Son Kontrol Listesi

Sunucuda deployment öncesi kontrol edin:

- [ ] `backend/.env` dosyası var ve doğru yapılandırılmış
- [ ] `docker-datatabse-stack/.env` dosyası var ve doğru yapılandırılmış
- [ ] `backend/.env` dosyasında `DB_SYNC=false` (production için)
- [ ] `infra/traefik/docker-compose.yml` portları 80/443 (sunucuda)
- [ ] Database volume'ları var (`docker volume ls | grep postgres`)
- [ ] Network'ler var (`docker network ls | grep -E 'web|global_databases_network'`)
- [ ] DNS wildcard A record eklendi (`*.saastour360.com` → `185.209.228.189`)
- [ ] Firewall 80 ve 443 portlarını açıyor
- [ ] Güçlü şifreler kullanılıyor

---

## 🚀 Deployment Komutları

### İlk Kurulum (Production):

```bash
# Sunucuda
cd /var/www/html/saastour360

# Database ve .env dosyalarını kontrol et
ls -la backend/.env
ls -la docker-datatabse-stack/.env

# Traefik portlarını güncelle (80/443)
nano infra/traefik/docker-compose.yml

# DB_SYNC=false olduğundan emin ol
nano backend/.env

# Deployment
./deploy.sh full
```

### Güncelleme (Veriler Korunur):

```bash
# Sunucuda
cd /var/www/html/saastour360
./deploy.sh full  # ✅ Database verileri otomatik korunur
```

---

## ✅ Özet

### Doğru Yapılandırılmış ✅:

1. ✅ Database volume yapılandırması (veriler kalıcı)
2. ✅ deploy.sh database koruma mekanizması
3. ✅ Network yapılandırması
4. ✅ Container restart politikaları
5. ✅ Database bağlantı yapılandırması
6. ✅ Environment variable yapısı

### Sunucuda Yapılması Gerekenler ⚠️:

1. ⚠️ Traefik portları: `80:80` ve `443:443` yap
2. ⚠️ `backend/.env`: `DB_SYNC=false` kontrol et
3. ⚠️ Güçlü şifreler kullan
4. ⚠️ DNS wildcard A record ekle

**Sonuç**: ✅ Tüm yapılandırmalar doğru, sadece sunucuda port ve DB_SYNC kontrolü yapın!

