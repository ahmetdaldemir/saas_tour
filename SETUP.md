# 🚀 Proje Kurulum Kılavuzu

Bu kılavuz, projeyi yeni bir bilgisayarda sıfırdan kurmak için gereken tüm adımları içerir.

## 📋 Gereksinimler

- **Docker** (20.10 veya üzeri)
- **Docker Compose** (2.0 veya üzeri)
- **Node.js** (20.x veya üzeri) - Sadece build için gerekli
- **npm** veya **yarn**
- **Git**

### Docker Kurulumu

**macOS:**
```bash
brew install --cask docker
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install docker.io docker-compose
sudo usermod -aG docker $USER
```

**Windows:**
[Docker Desktop](https://www.docker.com/products/docker-desktop) indirin ve kurun.

## 🔧 İlk Kurulum Adımları

### 1. Projeyi Klonlayın

```bash
git clone <repository-url>
cd saas_tour-1
```

### 2. Environment Dosyalarını Oluşturun

#### Backend .env Dosyası

```bash
cd backend
cp .env.example .env
```

`backend/.env` dosyasını düzenleyin:

```env
NODE_ENV=development
APP_PORT=3000
DB_HOST=global_postgres
DB_PORT=5432
DB_USERNAME=dev_user
DB_PASSWORD=dev_pass
DB_NAME=tour_saas
DB_SYNC=false
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRES_IN=12h
```

**⚠️ ÖNEMLİ:** Production'da `JWT_SECRET` değerini güçlü bir değerle değiştirin!

#### Database Stack .env Dosyası

```bash
cd docker-datatabse-stack
cp env.example .env
```

`docker-datatabse-stack/.env` dosyasını kontrol edin (genellikle değişiklik gerekmez):

```env
POSTGRES_PORT=5432
POSTGRES_DB=dev_db
POSTGRES_USER=dev_user
POSTGRES_PASSWORD=dev_pass
REDIS_PORT=6379
REDIS_PASSWORD=dev_pass
# ... diğer servisler
```

### 3. Deploy Script'ini Çalıştırın

Proje root dizininde:

```bash
chmod +x deploy.sh
./deploy.sh development
```

Bu komut:
- ✅ Database stack'i başlatır
- ✅ Traefik'i başlatır
- ✅ Backend ve Frontend'i build eder
- ✅ Tüm servisleri başlatır

**Not:** İlk kurulum için `development` modu kullanın. Bu mod sadece lokal deployment yapar, sunucuya deploy etmez.

### 4. Local Domain Yapılandırması (Opsiyonel)

Multi-tenant subdomain'leri kullanmak için `/etc/hosts` dosyasına ekleyin:

**macOS/Linux:**
```bash
sudo nano /etc/hosts
```

Aşağıdaki satırları ekleyin:
```
127.0.0.1 sunset.local.saastour360.test
127.0.0.1 berg.local.saastour360.test
127.0.0.1 traefik.local.saastour360.test
```

**Windows:**
`C:\Windows\System32\drivers\etc\hosts` dosyasını yönetici olarak düzenleyin.

### 5. Uygulamaya Erişim

Deployment tamamlandıktan sonra:

- **Frontend (Direkt):** http://localhost:9001
- **Backend API (Direkt):** http://localhost:4001/api
- **Sunset Tenant (Traefik):** http://sunset.local.saastour360.test:5001
- **Berg Tenant (Traefik):** http://berg.local.saastour360.test:5001
- **Traefik Dashboard:** http://localhost:8080

## 🔄 Güncelleme (Başka Bilgisayardan)

Projeyi başka bir bilgisayarda güncellemek için:

```bash
# 1. Projeyi çekin
git pull origin main

# 2. Dependencies'leri güncelleyin (gerekirse)
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# 3. Deploy edin
./deploy.sh development
```

## 🌐 Production Deployment

### Sunucuya İlk Kurulum

1. **Sunucuya bağlanın:**
```bash
ssh user@your-server
```

2. **Projeyi klonlayın:**
```bash
cd /var/www/html
git clone <repository-url> saastour360
cd saastour360
```

3. **Environment dosyalarını oluşturun:**
```bash
cd backend && cp .env.example .env && nano .env
cd ../docker-datatabse-stack && cp env.example .env && nano .env
```

4. **Production değerlerini ayarlayın:**
   - `backend/.env`: Production database bilgileri, güçlü JWT_SECRET
   - `docker-datatabse-stack/.env`: Production database şifreleri

5. **Deploy edin:**
```bash
chmod +x deploy.sh
./deploy.sh production
```

### Sunucuya Güncelleme (Zero-Downtime)

Sunucuda çalışan versiyonu bozmadan güncellemek için:

```bash
# Sunucuda
cd /var/www/html/saastour360
git pull origin main
./deploy.sh infra
```

`infra` modu:
- ✅ Sadece container'ları rebuild eder
- ✅ Zero-downtime deployment yapar
- ✅ Çalışan servisleri bozmaz
- ✅ Veritabanı verilerini korur

## 🔐 Güvenlik Notları

### Environment Variables

**ASLA** aşağıdaki dosyaları Git'e commit etmeyin:
- `.env`
- `.env.*` (`.env.example` hariç)
- `backend/.env`
- `docker-datatabse-stack/.env`

### GitHub Secrets (CI/CD için)

GitHub Actions kullanıyorsanız, repository'nize şu secrets'ları ekleyin:

1. GitHub Repository → Settings → Secrets and variables → Actions
2. New repository secret ekleyin:
   - `SFTP_HOST`: Sunucu IP adresi
   - `SFTP_USERNAME`: SSH kullanıcı adı
   - `SFTP_PASSWORD`: SSH şifresi
   - `SFTP_PORT`: SSH port (varsayılan: 22)
   - `SFTP_REMOTE_PATH`: Deployment dizini (varsayılan: /var/www/html/saastour360)

## 🛠️ Sorun Giderme

### Database Bağlantı Hatası

```bash
# Database container'ının çalıştığını kontrol edin
docker ps | grep global_postgres

# Network'ün mevcut olduğunu kontrol edin
docker network ls | grep global_databases_network

# Backend .env dosyasında DB_HOST=global_postgres olduğunu kontrol edin
```

### Port Çakışması

Eğer portlar kullanılıyorsa:

```bash
# Hangi process portu kullanıyor?
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis
lsof -i :4001  # Backend
lsof -i :9001  # Frontend
```

### Container'lar Başlamıyor

```bash
# Logları kontrol edin
docker-compose logs backend
docker-compose logs frontend

# Container durumunu kontrol edin
docker-compose ps

# Tüm container'ları temizleyip yeniden başlatın
docker-compose down
./deploy.sh development
```

### Migration Hataları

İlk kurulum için `backend/.env` dosyasına ekleyin:

```env
DB_SYNC=true
```

Şema oluşturulduktan sonra `DB_SYNC=false` yapın veya kaldırın.

## 📝 Yararlı Komutlar

```bash
# Container loglarını görüntüle
docker-compose logs -f backend
docker-compose logs -f frontend

# Container'ları durdur
docker-compose down

# Container'ları yeniden başlat
docker-compose restart backend

# Database seed çalıştır
./deploy.sh seed

# Sadece build (container'lar çalışıyorsa)
./deploy.sh build

# Sadece infra (zero-downtime)
./deploy.sh infra
```

## 🎯 Deployment Modları

| Mod | Açıklama | Kullanım |
|-----|----------|----------|
| `development` | Sadece lokal deployment | Yeni kurulum, development |
| `local` | `development` ile aynı | Yeni kurulum, development |
| `production` | Lokal + Sunucuya deploy | Production deployment |
| `infra` | Zero-downtime update | Sunucuda güncelleme |
| `build` | Sadece Docker build | Container'lar çalışıyorsa |
| `seed` | Database seed | İlk veri yükleme |

## 📚 Ek Dokümantasyon

- [README.md](./README.md) - Genel proje bilgileri
- [DOCUMENTATION.md](./DOCUMENTATION.md) - Detaylı API ve modül dokümantasyonu
- [.github/DEPLOY_SETUP.md](./.github/DEPLOY_SETUP.md) - GitHub Actions kurulumu

## ❓ Yardım

Sorun yaşarsanız:
1. Logları kontrol edin: `docker-compose logs`
2. Container durumunu kontrol edin: `docker-compose ps`
3. Environment dosyalarını kontrol edin
4. GitHub Issues'da sorun açın

