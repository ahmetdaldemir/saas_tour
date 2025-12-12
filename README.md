# SaaS Tour Platform

Monorepo tasarımında Node.js (TypeORM) backend ve Vue.js frontend içeren çok kiracılı (multi-tenant) tur ve araç kiralama SaaS projesi.

## 📁 Proje Yapısı

```
├── backend/          # Express + TypeORM tabanlı API
├── frontend/         # Vue 3 + Vite yönetim paneli (Nginx ile servis edilir)
├── infra/            # Docker Compose konfigürasyonu
└── docker-datatabse-stack/  # Merkezi database servisleri (PostgreSQL, Redis, MongoDB, Elasticsearch)
```

## 🚀 Hızlı Başlangıç

### 1. Database Stack'i Başlat

```bash
cd docker-datatabse-stack
cp env.example .env
# .env dosyasını düzenleyin
docker-compose up -d
```

### 2. Backend ve Frontend'i Başlat

```bash
cd infra
# Backend .env dosyasını oluşturun
cp ../backend/.env.example ../backend/.env
# .env dosyasını düzenleyin

# Docker Compose ile başlat
docker-compose up -d --build
```

### 3. Uygulamaya Erişim

- **Backend API**: http://localhost:3000/api
- **Frontend**: http://localhost:8080

> **Not**: Portlar environment variable'lar ile değiştirilebilir (BACKEND_PORT, FRONTEND_PORT)

## 🔧 Yapılandırma

### Backend Environment Variables

`backend/.env` dosyasını oluşturun:

```env
NODE_ENV=development
APP_PORT=3000
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
export BACKEND_PORT=3000        # Default: 3000
export FRONTEND_PORT=8080       # Default: 8080

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

### Local Development

```bash
cd infra
docker-compose up -d --build
```

### Production

```bash
cd infra
export NODE_ENV=production
export BACKEND_PORT=3000
export FRONTEND_PORT=8001
docker-compose up -d --build
```

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
export BACKEND_PORT=3001
export FRONTEND_PORT=8081
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
