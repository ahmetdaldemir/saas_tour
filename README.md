# SaaS Tour Platform

Monorepo tasarımında Node.js (TypeORM) backend ve Vue.js frontend içeren çok kiracılı (multi-tenant) tur ve araç kiralama SaaS projesi.

> 📚 **Kapsamlı Dokümantasyon:** Detaylı kurulum, modül dokümantasyonu, API referansı ve deployment kılavuzu için [DOCUMENTATION.md](./DOCUMENTATION.md) dosyasına bakın.

> 🚀 **Yeni Bilgisayarda Kurulum:** Projeyi başka bir bilgisayarda kurmak için [SETUP.md](./SETUP.md) dosyasına bakın.

## 📁 Proje Yapısı

```
├── backend/          # Express + TypeORM tabanlı API
├── frontend/         # Vue 3 + Vite yönetim paneli (Nginx ile servis edilir)
├── infra/            # Docker Compose konfigürasyonu
└── docker-datatabse-stack/  # Merkezi database servisleri (PostgreSQL, Redis, MongoDB, Elasticsearch)
```

## 🚀 Hızlı Başlangıç

### Otomatik Deployment (Önerilen)

Tüm sistemi tek komutla başlatmak için:

```bash
# Tam deployment (veriler korunur, migration'lar çalıştırılır)
./deploy.sh

# Veya database'i sıfırdan kurmak için (DİKKAT: Tüm veriler silinir!)
./deploy.sh --fresh-db
```

Deploy script'i şunları yapar:
- ✅ Database stack'i başlatır (veriler korunur)
- ✅ Web network'ü oluşturur
- ✅ Traefik'i başlatır (multi-tenant routing)
- ✅ Backend ve Frontend'i build edip başlatır
- ✅ Yeni migration varsa çalıştırır (veriler korunur)

### Manuel Kurulum

#### 1. Database Stack'i Başlat

```bash
cd docker-datatabse-stack
cp env.example .env
# .env dosyasını düzenleyin
docker-compose up -d
```

#### 2. Traefik'i Başlat (Multi-Tenant Subdomain Routing)

```bash
# Docker web network'ünü oluştur (eğer yoksa)
docker network create web

# Traefik'i başlat
cd infra/traefik
docker-compose up -d
```

#### 3. Backend ve Frontend'i Başlat

```bash
cd infra
# Backend .env dosyasını oluşturun
cp ../backend/.env.example ../backend/.env
# .env dosyasını düzenleyin

# Docker Compose ile başlat
docker-compose up -d --build
```

### 4. Local Domain Yapılandırması (Manuel kurulum için)

Local development için `/etc/hosts` dosyasına tenant subdomain'lerini ekleyin:

```bash
sudo nano /etc/hosts
```

Aşağıdaki satırları ekleyin:

```
127.0.0.1 sunset.local.saastour360.test
127.0.0.1 berg.local.saastour360.test
127.0.0.1 traefik.local.saastour360.test
```

### 5. Uygulamaya Erişim

**Multi-Tenant Subdomain ile (Traefik üzerinden):**
- **Sunset Tenant**: http://sunset.local.saastour360.test:5001
- **Berg Tenant**: http://berg.local.saastour360.test:5001
- **Traefik Dashboard**: http://localhost:8080

**Direkt Erişim (Mevcut sistemle uyumlu):**
- **Frontend**: http://localhost:9001
- **Backend API**: http://localhost:4001/api

**Production (Traefik ile):**
- **Sunset Tenant**: https://sunset.saastour360.com (Traefik 80/443'te çalışır)
- **Berg Tenant**: https://berg.saastour360.com (Traefik 80/443'te çalışır)

> **Not**: Local development için Traefik kullanıyorsanız, port mapping'ler (BACKEND_PORT, FRONTEND_PORT) artık kullanılmaz. Tüm trafik Traefik üzerinden yönlendirilir.

## 🔧 Yapılandırma

### Backend Environment Variables

`backend/.env` dosyasını oluşturun:

```env
NODE_ENV=development
APP_PORT=3000  # Container içi port (değiştirilmemeli)
DB_HOST=global_postgres
DB_PORT=5432
DB_USERNAME=dev_user
DB_PASSWORD=dev_pass
DB_NAME=tour_saas
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=12h

# İsteğe bağlı: RapidAPI entegrasyonu
RAPIDAPI_KEY=your_rapidapi_key
RAPIDAPI_TRAVEL_ADVISOR_HOST=travel-advisor.p.rapidapi.com
```

### Docker Compose Environment Variables

`infra/` klasöründe environment variable'lar ile yapılandırma:

```bash
# Portlar
export BACKEND_PORT=4001        # Default: 4001 (host port)
export FRONTEND_PORT=9001       # Default: 9001 (host port)

# Node Environment
export NODE_ENV=production      # Default: development

# Database (backend/.env'den de okunabilir)
export DB_USERNAME=tour_admin
export DB_PASSWORD=tour_admin
export DB_NAME=tour_saas

# Nginx Proxy (production için)
export VIRTUAL_HOST=saas.local
export LETSENCRYPT_HOST=saas.local
export LETSENCRYPT_EMAIL=admin@example.com
export PROXY_NETWORK_NAME=nginx-proxy-cloudflare-full_default
```

## 🐳 Docker Compose Kullanımı

### Multi-Tenant Wildcard Subdomain Mimarisi

Bu proje **multi-tenant wildcard subdomain** mimarisi kullanmaktadır:

- Her tenant kendi subdomain'i üzerinden erişilir
- Tenant çözümleme Host header'ından otomatik yapılır
- Yeni tenant eklemek için sadece database'e kayıt eklenmesi yeterlidir
- Traefik wildcard routing ile otomatik SSL yönetimi sağlar

**Örnek Tenant Subdomain'leri:**
- `sunset.saastour360.com` → Sunset tenant (Production)
- `berg.saastour360.com` → Berg tenant (Production)
- `sunset.local.saastour360.test` → Sunset tenant (Local Development)

### Local Development

**1. Traefik'i başlat:**
```bash
# Docker web network'ünü oluştur (eğer yoksa)
docker network create web

# Traefik'i başlat
cd infra/traefik
docker-compose up -d
```

**2. Backend ve Frontend'i başlat:**
```bash
cd infra
docker-compose up -d --build
```

**3. /etc/hosts dosyasını yapılandır:**
```bash
sudo nano /etc/hosts
# Aşağıdaki satırları ekleyin:
127.0.0.1 sunset.local.saastour360.test
127.0.0.1 berg.local.saastour360.test
127.0.0.1 traefik.local.saastour360.test
```

**4. Tarayıcıda test edin:**
- http://sunset.local.saastour360.test:5001 (Traefik üzerinden)
- http://berg.local.saastour360.test:5001 (Traefik üzerinden)
- http://localhost:9001 (Frontend - direkt erişim)
- http://localhost:4001/api (Backend API - direkt erişim)
- http://localhost:8080 (Traefik Dashboard)

### Production

**1. Traefik'i başlat:**
```bash
cd infra/traefik
docker-compose up -d
```

**2. Backend ve Frontend'i başlat:**
```bash
cd infra
export NODE_ENV=production
docker-compose up -d --build
```

**3. DNS yapılandırması:**
- Wildcard DNS kaydı: `*.saastour360.com` → Server IP
- Production'da Traefik 80/443 portlarında çalışır (standart HTTP/HTTPS)
- Local'de Traefik 5001/5443 portlarında çalışır (çakışma önleme)
- Traefik otomatik olarak Let's Encrypt SSL sertifikası alacaktır

### Yeni Tenant Ekleme

Yeni bir tenant eklemek için:

1. **Database'e tenant kaydı ekleyin:**
   ```sql
   INSERT INTO tenants (id, name, slug, category, is_active, created_at, updated_at)
   VALUES (
     gen_random_uuid(),
     'New Tenant Name',
     'newtenant',  -- Subdomain slug (örn: newtenant.saastour360.com)
     'rentacar',   -- veya 'tour'
     true,
     NOW(),
     NOW()
   );
   ```

2. **DNS yapılandırması (Production):**
   - Wildcard DNS kaydı (`*.saastour360.com`) zaten mevcut olduğu için ek işlem gerekmez
   - Traefik otomatik olarak yeni subdomain'i tanıyacak ve SSL sertifikası alacaktır

3. **Local Development:**
   - `/etc/hosts` dosyasına yeni tenant için entry ekleyin:
     ```
     127.0.0.1 newtenant.local.saastour360.test
     ```

4. **Test:**
   - http://newtenant.local.saastour360.test (local)
   - https://newtenant.saastour360.com (production)

> **Önemli:** Tenant slug'ı sadece küçük harf, rakam ve tire (-) içerebilir. Regex pattern: `^[a-z0-9-]+$`

### Komutlar

```bash
# Container'ları başlat
docker-compose up -d

# Container'ları durdur
docker-compose down

# Logları görüntüle
docker-compose logs -f

# Container durumunu kontrol et
docker-compose ps

# Belirli bir service'i yeniden başlat
docker-compose restart backend
docker-compose restart frontend
```

## 📦 Backend

### Modüller

- **Tenants**: Çok kiracılı yapı yönetimi
- **Destinations**: Turizm bölgeleri
- **Hotels**: Otel yönetimi
- **Blogs**: Blog yönetimi
- **Reservations**: Rezervasyon yönetimi
- **Tours**: Tur paketleri ve yönetimi
- **Rentacar**: Araç kiralama ve yönetimi
- **Operations**: Operasyon yönetimi

### Geliştirme

```bash
cd backend
npm install
npm run dev        # Development mode (ts-node-dev)
npm run build      # Build
npm start          # Production mode
```

### Database Schema

Production'da otomatik migration çalıştırılır. İlk kurulum için:

```bash
# backend/.env dosyasına ekleyin:
DB_SYNC=true
```

Şema oluşturulduktan sonra `DB_SYNC` satırını kaldırın veya false yapın.

### Import Scripts

#### Destinasyon Import

```bash
cd backend
npm run import:destinations
```

Tüm Türkiye'deki turizm bölgelerini (Istanbul, Antalya, Bodrum, vb.) RapidAPI'den import eder.

#### Otel Import

```bash
cd backend
npm run import:hotels -- --city Antalya --limit 100 --radius 5
```

Parametreler:
- `--city`: Şehir adı (Antalya, Side, Kemer, vb.)
- `--limit`: Maksimum sonuç sayısı (default: 50)
- `--radius`: Yarıçap (km) (default: 5)

## 🎨 Frontend

### Teknoloji Stack

- Vue 3 (Composition API)
- Vite
- Vuetify 3
- Vue Router
- Axios

### Geliştirme

```bash
cd frontend
npm install
npm run dev        # Development server
npm run build      # Production build
```

### Yapı

- **Dashboard**: Ana panel
- **Tours**: Tur yönetimi
- **Rentacar**: Araç kiralama yönetimi
- **Reservations**: Rezervasyon yönetimi
- **CRM**: Müşteri yönetimi
- **Blogs**: Blog yönetimi

## 🔐 Güvenlik

- JWT tabanlı authentication
- Multi-tenant data isolation
- Environment variable'lar ile hassas bilgilerin korunması
- Production'da `synchronize: false` (migration'lar kullanılır)

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - Giriş
- `POST /api/auth/register` - Kayıt

### Tours
- `GET /api/tours` - Tur listesi
- `POST /api/tours` - Yeni tur oluştur
- `GET /api/tours/:id` - Tur detayı
- `PUT /api/tours/:id` - Tur güncelle
- `DELETE /api/tours/:id` - Tur sil

### Rentacar
- `GET /api/rentacar/vehicles` - Araç listesi
- `GET /api/rentacar/locations` - Lokasyon listesi
- `POST /api/rentacar/reservations` - Rezervasyon oluştur

## 🌐 Production Deployment

### 1. Sunucuya Dosyaları Yükle

SFTP veya rsync ile projeyi sunucuya yükleyin:

```bash
rsync -avz --exclude 'node_modules' --exclude '.git' \
  ./ root@your-server:/var/www/html/saastour360/
```

### 2. Environment Variables Ayarla

```bash
# Backend .env
cd /var/www/html/saastour360/backend
cp .env.example .env
nano .env  # Production değerlerini girin

# Database stack .env
cd /var/www/html/saastour360/docker-datatabse-stack
cp env.example .env
nano .env  # Production değerlerini girin
```

### 3. Database Stack'i Başlat

```bash
cd /var/www/html/saastour360/docker-datatabse-stack
docker-compose up -d
```

### 4. Backend ve Frontend'i Başlat

```bash
cd /var/www/html/saastour360/infra
export NODE_ENV=production
docker-compose up -d --build
```

### 5. Logları Kontrol Et

```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

## 🔧 Sorun Giderme

### Database Bağlantı Hatası

1. Database stack'in çalıştığını kontrol edin:
   ```bash
   docker ps | grep global_postgres
   ```

2. Network'ün mevcut olduğunu kontrol edin:
   ```bash
   docker network ls | grep global_databases_network
   ```

3. Backend .env dosyasında `DB_HOST=global_postgres` olduğunu kontrol edin.

### Migration Hatası

İlk kurulum için `backend/.env` dosyasına `DB_SYNC=true` ekleyin:

```env
DB_SYNC=true
```

Şema oluşturulduktan sonra bu satırı kaldırın.

### Port Çakışması

Portları environment variable ile değiştirin:

```bash
export BACKEND_PORT=4002
export FRONTEND_PORT=9002
docker-compose up -d
```

## 📝 Notlar

- Database schema production'da otomatik migration ile yönetilir
- İlk kurulum için `DB_SYNC=true` kullanılabilir (sonra kaldırılmalı)
- Local ve production aynı `docker-compose.yml` dosyasını kullanır
- Environment variable'lar ile farklı ortamlar yapılandırılabilir
- Frontend Nginx ile servis edilir ve backend'e reverse proxy yapar

## 📄 Lisans

[Lisans bilgisi buraya eklenecek]
