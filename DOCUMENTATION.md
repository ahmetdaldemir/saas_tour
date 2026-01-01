# SaaS Tour Platform - Kapsamlı Dokümantasyon

**Son Güncelleme:** 2025-12-13  
**Versiyon:** 1.0.0  
**Proje Tipi:** Multi-tenant SaaS Platform (Tur & Araç Kiralama)

---

## 📋 İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Hızlı Başlangıç](#hızlı-başlangıç)
3. [Proje Yapısı](#proje-yapısı)
4. [Kurulum ve Yapılandırma](#kurulum-ve-yapılandırma)
5. [Modüller](#modüller)
   - [Chat / Agency Modülü](#chat--agency-modülü)
   - [VIP Transfer Modülü](#vip-transfer-modülü)
6. [API Dokümantasyonu](#api-dokümantasyonu)
7. [Deployment](#deployment)
   - [GitHub Actions CI/CD](#github-actions-cicd)
   - [Cloudflare Subdomain Kurulumu](#cloudflare-subdomain-kurulumu)
8. [Geliştirme Kılavuzu](#geliştirme-kılavuzu)
9. [Sorun Giderme](#sorun-giderme)
10. [Email Queue System](#-email-queue-system-rabbitmq)
11. [Seed Komutları](#-seed-komutları)

---

## 🎯 Genel Bakış

### Proje Amacı

Multi-tenant (çok kiracılı) bir SaaS platformu. İki ana kategori destekleniyor:
- **Tour (Tur)**: Tur paketleri ve yönetimi
- **Rent A Car**: Araç kiralama ve operasyon yönetimi

### Teknoloji Stack

**Backend:**
- Express.js 5.1.0
- TypeORM 0.3.27
- PostgreSQL
- TypeScript
- Socket.io (WebSocket)

**Frontend:**
- Vue 3 (Composition API)
- Vite
- Vuetify 3
- Vue Router
- Axios
- Socket.io-client

**Infrastructure:**
- Docker & Docker Compose
- Nginx (Reverse Proxy)
- GitHub Actions (CI/CD)

---

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

- **Backend API**: http://localhost:4001/api
- **Frontend**: http://localhost:9001

> **Not**: Portlar environment variable'lar ile değiştirilebilir (BACKEND_PORT, FRONTEND_PORT)

---

## 📁 Proje Yapısı

```
saas_tour-1/
├── backend/                    # Express + TypeORM tabanlı API
│   ├── src/
│   │   ├── modules/           # Modüler yapı
│   │   │   ├── chat/          # Chat modülü
│   │   │   ├── transfer/      # Transfer modülü
│   │   │   ├── tenants/       # Tenant yönetimi
│   │   │   └── shared/        # Paylaşılan modüller
│   │   ├── config/            # Yapılandırma dosyaları
│   │   ├── middleware/        # Express middleware'leri
│   │   ├── routes/            # Route tanımlamaları
│   │   ├── services/          # Business logic servisleri
│   │   └── utils/             # Yardımcı fonksiyonlar
│   ├── public/                # Static dosyalar (widget.js)
│   └── .env                   # Environment variables
├── frontend/                   # Vue 3 + Vite yönetim paneli
│   ├── src/
│   │   ├── views/             # Sayfa componentleri
│   │   ├── components/        # Reusable componentler
│   │   ├── stores/            # Pinia state management
│   │   └── modules/           # Utility modülleri
│   └── nginx/                 # Nginx konfigürasyonu
├── infra/                      # Docker Compose konfigürasyonu
│   ├── docker-compose.yml     # Ana compose dosyası
│   └── nginx-chat.saastour360.com.conf  # Chat subdomain config
├── docker-datatabse-stack/     # Merkezi database servisleri
│   └── docker-compose.yml     # PostgreSQL, Redis, vb.
└── .github/
    └── workflows/
        └── deploy.yml         # CI/CD workflow
```

---

## ⚙️ Kurulum ve Yapılandırma

### Backend Environment Variables

`backend/.env` dosyasını oluşturun:

```env
NODE_ENV=development
APP_PORT=3000  # Container içi port (değiştirilmemeli - host port 4001)
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
export BACKEND_PORT=4001        # Default: 4001 (host port)
export FRONTEND_PORT=9001       # Default: 9001 (host port)
export NODE_ENV=production      # Default: development
export DB_USERNAME=tour_admin
export DB_PASSWORD=tour_admin
export DB_NAME=tour_saas
```

### Database Schema

Production'da otomatik migration çalıştırılır. İlk kurulum için:

```bash
# backend/.env dosyasına ekleyin:
DB_SYNC=true
```

Şema oluşturulduktan sonra bu satırı kaldırın veya `false` yapın.

---

## 📦 Modüller

### Chat / Agency Modülü

Live Chat modülü, web sitesi ziyaretçileri ile admin panel arasında gerçek zamanlı mesajlaşma sağlar.

#### Özellikler

- ✅ WebSocket tabanlı gerçek zamanlı iletişim
- ✅ Widget embed sistemi (JS embed kodu)
- ✅ Multi-tenant desteği
- ✅ Admin panel entegrasyonu
- ✅ Ziyaretçi bilgileri yönetimi
- ✅ Okunmamış mesaj takibi

#### Database Schema

**ChatRoom:**
- `tenantId`: Tenant ID (zorunlu)
- `title`: Room başlığı
- `status`: active, closed, archived
- `visitorId`: Ziyaretçi benzersiz ID
- `visitorName`, `visitorEmail`, `visitorPhone`: Ziyaretçi bilgileri
- `lastMessageAt`: Son mesaj zamanı
- `unreadCount`: Okunmamış mesaj sayısı

**ChatMessage:**
- `roomId`: Chat room ID
- `senderType`: admin, visitor, system
- `adminUserId`: Admin user ID (admin mesajlarında)
- `messageType`: text, file, system
- `content`: Mesaj içeriği
- `isRead`: Okundu mu?

**ChatWidgetToken:**
- `tenantId`: Tenant ID (unique)
- `publicKey`: Widget embed için public key
- `secretKey`: Backend doğrulama için secret key
- `isActive`: Aktif mi?
- `lastUsedAt`: Son kullanım zamanı

#### Widget Embed

Admin panel'den widget token'ı alındıktan sonra:

```html
<script
  src="https://chat.saastour360.com/widget.js"
  data-tenant="TENANT_ID"
  data-key="PUBLIC_WIDGET_KEY">
</script>
```

#### API Endpoints

**Admin (Authenticated):**
- `GET /api/chat/rooms` - Chat room listesi
- `GET /api/chat/rooms/:id` - Room detayı ve mesajları
- `POST /api/chat/rooms/:id/messages` - Mesaj gönder
- `POST /api/chat/rooms/:id/read` - Mesajları okundu işaretle
- `GET /api/chat/widget-token` - Widget token al
- `POST /api/chat/widget-token/regenerate` - Token yenile

**Public (Widget):**
- `POST /api/chat/widget/rooms` - Visitor room oluştur/al
- `GET /api/chat/widget/rooms/:id/messages` - Mesajları getir

#### WebSocket Events

**Admin:**
- `join_room` - Odaya katıl
- `send_message` - Mesaj gönder
- `typing:start` - Yazıyor göstergesi başlat
- `typing:stop` - Yazıyor göstergesi durdur

**Widget:**
- `send_message` - Ziyaretçi mesaj gönder

**Server:**
- `new_message` - Yeni mesaj geldi
- `room_messages` - Oda mesajları
- `joined_room` - Odaya katıldı

---

### VIP Transfer Modülü

Havalimanı, otel, şehir içi ve şehirler arası transfer yönetimi.

#### Özellikler

- ✅ Transfer araç yönetimi (VIP, Shuttle, Premium, Luxury)
- ✅ Rota yönetimi (Airport → Hotel, City to City)
- ✅ Fiyatlandırma modelleri (Fixed, Per KM, Per Hour)
- ✅ Rezervasyon yönetimi
- ✅ Şoför yönetimi
- ✅ B2B ve B2C desteği

#### Database Schema

**TransferVehicle:**
- `name`: Araç adı
- `type`: VIP, Shuttle, Premium, Luxury
- `passengerCapacity`: Yolcu kapasitesi
- `luggageCapacity`: Bagaj kapasitesi
- `hasDriver`: Şoförlü mü?
- `features`: Özellikler (JSONB)
- `isActive`: Aktif mi?

**TransferRoute:**
- `name`: Rota adı
- `originPoint`: Çıkış noktası
- `destinationPoint`: Varış noktası
- `distanceKm`: Mesafe (km)
- `averageDurationMinutes`: Ortalama süre
- `routeType`: Airport-Hotel, City-City, vb.
- `isActive`: Aktif mi?

**TransferPricing:**
- `transferVehicle`: Araç referansı
- `transferRoute`: Rota referansı
- `isRoundTrip`: Gidiş-dönüş mü?
- `basePrice`: Sabit fiyat
- `pricePerKm`: Km başına fiyat
- `pricePerHour`: Saat başına fiyat
- `nightSurcharge`: Gece ek ücreti
- `extraServicePrices`: Ek hizmet fiyatları (JSONB)

**TransferReservation:**
- `reference`: Rezervasyon kodu
- `transferType`: Airport, Hotel, City, Intercity
- `transferVehicle`: Araç referansı
- `transferRoute`: Rota referansı
- `driver`: Şoför referansı
- `pickupDate`, `pickupTime`: Alış tarih/saat
- `passengerName`, `passengerEmail`, `passengerPhone`: Yolcu bilgileri
- `flightNumber`: Uçuş numarası (opsiyonel)
- `status`: Pending, Confirmed, Completed, Cancelled

**TransferDriver:**
- `name`: Şoför adı
- `phone`: Telefon
- `email`: E-posta
- `licenseNumber`: Ehliyet numarası
- `languages`: Diller (JSONB)
- `isActive`: Aktif mi?

#### API Endpoints

**Transfer Vehicles:**
- `GET /api/transfer/vehicles` - Araç listesi
- `POST /api/transfer/vehicles` - Yeni araç
- `GET /api/transfer/vehicles/:id` - Araç detayı
- `PUT /api/transfer/vehicles/:id` - Araç güncelle
- `DELETE /api/transfer/vehicles/:id` - Araç sil

**Transfer Routes:**
- `GET /api/transfer/routes` - Rota listesi
- `POST /api/transfer/routes` - Yeni rota
- `GET /api/transfer/routes/:id` - Rota detayı
- `PUT /api/transfer/routes/:id` - Rota güncelle
- `DELETE /api/transfer/routes/:id` - Rota sil

**Transfer Pricing:**
- `GET /api/transfer/pricings` - Fiyat listesi
- `POST /api/transfer/pricings` - Yeni fiyat
- `GET /api/transfer/pricings/:id` - Fiyat detayı
- `PUT /api/transfer/pricings/:id` - Fiyat güncelle
- `DELETE /api/transfer/pricings/:id` - Fiyat sil

**Transfer Reservations:**
- `GET /api/transfer/reservations` - Rezervasyon listesi
- `POST /api/transfer/reservations` - Yeni rezervasyon
- `GET /api/transfer/reservations/:id` - Rezervasyon detayı
- `PUT /api/transfer/reservations/:id` - Rezervasyon güncelle
- `DELETE /api/transfer/reservations/:id` - Rezervasyon sil

**Transfer Drivers:**
- `GET /api/transfer/drivers` - Şoför listesi
- `POST /api/transfer/drivers` - Yeni şoför
- `GET /api/transfer/drivers/:id` - Şoför detayı
- `PUT /api/transfer/drivers/:id` - Şoför güncelle
- `DELETE /api/transfer/drivers/:id` - Şoför sil

---

## 📡 API Dokümantasyonu

### Authentication

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password"
}

Response:
{
  "token": "JWT_TOKEN",
  "user": { ... },
  "tenant": { ... }
}
```

```http
POST /api/auth/register
Content-Type: application/json

{
  "tenantName": "My Company",
  "tenantCategory": "rentacar",
  "adminName": "Admin",
  "adminEmail": "admin@example.com",
  "adminPassword": "password"
}
```

### Tours

```http
GET /api/tours
GET /api/tours/:id
POST /api/tours
PUT /api/tours/:id
DELETE /api/tours/:id
```

### Rentacar

```http
GET /api/rentacar/vehicles
GET /api/rentacar/locations
POST /api/rentacar/reservations
GET /api/vehicle-categories
GET /api/vehicle-brands
GET /api/vehicle-models
```

### Chat (Detaylar yukarıda)

### Transfer (Detaylar yukarıda)

### Diğer Endpoints

**Destinations:**
- `GET /api/destinations` - Destinasyon listesi
- `POST /api/destinations` - Yeni destinasyon
- `POST /api/destinations/import` - RapidAPI'den import

**Hotels:**
- `GET /api/hotels` - Otel listesi
- `POST /api/hotels` - Yeni otel

**Blogs:**
- `GET /api/blogs` - Blog listesi
- `POST /api/blogs` - Yeni blog

**Reservations:**
- `GET /api/reservations` - Rezervasyon listesi
- `POST /api/reservations` - Yeni rezervasyon
- `PUT /api/reservations/:id/status` - Durum güncelle

**Settings:**
- `GET /api/settings` - Tenant ayarları
- `PUT /api/settings` - Ayarları güncelle
- `POST /api/settings/upload` - Logo/favicon yükle

**Users:**
- `GET /api/tenant-users` - Kullanıcı listesi
- `POST /api/tenant-users` - Yeni kullanıcı
- `PUT /api/tenant-users/:id` - Kullanıcı güncelle
- `DELETE /api/tenant-users/:id` - Kullanıcı sil

### API Documentation Endpoint

Swagger/OpenAPI dokümantasyonu:
- `GET /api/docs` - OpenAPI JSON
- `GET /api/docs/readme` - Markdown dokümantasyon

---

## 🚀 Deployment

### GitHub Actions CI/CD

Otomatik deployment sistemi. `main` branch'ine merge edildiğinde otomatik deploy eder.

#### Kurulum

1. **GitHub Secrets Ekleme**

Repository Settings > Secrets and variables > Actions:

| Secret Adı | Örnek Değer | Açıklama |
|------------|-------------|----------|
| `SFTP_HOST` | `your-server-ip` | Sunucu IP adresi veya domain |
| `SFTP_USERNAME` | `deploy` | SSH/SFTP kullanıcı adı |
| `SFTP_PASSWORD` | `your-secure-password` | SSH/SFTP şifresi |
| `SFTP_PORT` | `22` | SSH port (varsayılan: 22) |
| `SFTP_REMOTE_PATH` | `/var/www/html/saastour360` | Sunucudaki deployment dizini |

2. **Workflow Tetikleme**

- ✅ `main` branch'ine direkt push yapıldığında
- ✅ `main` branch'ine pull request **merge edildiğinde**
- ✅ GitHub Actions UI'dan manuel olarak `workflow_dispatch` ile

#### Deployment Süreci

1. **Checkout**: Kod repository'den çekilir
2. **Node.js Setup**: Node.js 20 kurulur
3. **Dependencies**: Frontend ve backend dependencies yüklenir
4. **Build**: Frontend ve backend build edilir
5. **RSync Deploy**: Dosyalar sunucuya RSync ile yüklenir
6. **SSH Deploy**: Sunucuda `./deploy.sh infra` komutu çalıştırılır

#### Excluded Files

Aşağıdaki dosyalar/klasörler deployment'a dahil edilmez:

- `.git/`
- `node_modules/`
- `.vscode/`
- `.github/`
- `.env` dosyaları
- Log dosyaları
- `.DS_Store`
- `dist/` klasörleri (build edilmiş dosyalar)

---

### Cloudflare Subdomain Kurulumu

Chat widget için `chat.saastour360.com` subdomain kurulumu.

#### 1. Cloudflare DNS Kaydı Ekleme

1. **Cloudflare Dashboard'a Giriş Yapın**
   - https://dash.cloudflare.com
   - `saastour360.com` domain'inizi seçin

2. **DNS Sekmesine Gidin**
   - DNS > Records > Add record

3. **DNS Kaydı Ekleme**

   **A Record (Önerilen):**
   ```
   Type: A
   Name: chat
   IPv4 address: YOUR_SERVER_IP
   Proxy status: ⚪ DNS only (Gri bulut) - WebSocket için önemli!
   TTL: Auto
   ```

   **⚠️ ÖNEMLİ:** WebSocket kullanıyorsanız, Proxy status'unu **DNS only (Gri bulut)** yapın.

4. **Kaydı Kaydedin**
   - Save butonuna tıklayın
   - DNS yayılımı 1-5 dakika sürer

#### 2. Cloudflare SSL/TLS Ayarları

1. **SSL/TLS Sekmesine Gidin**
   - SSL/TLS > Overview

2. **SSL/TLS Encryption Mode**
   - **Full** veya **Full (strict)** seçin

3. **Always Use HTTPS**
   - SSL/TLS > Edge Certificates
   - Always Use HTTPS açın (opsiyonel)

#### 3. Cloudflare WebSocket Desteği

1. **Network Sekmesine Gidin**
   - Network > WebSockets: **ON**

#### 4. Sunucuda Nginx Yapılandırması

**Hazır config dosyası:** `infra/nginx-chat.saastour360.com.conf`

```bash
# 1. Proje dizinine git
cd /var/www/html/saastour360/infra

# 2. Config dosyasını kopyala
sudo cp nginx-chat.saastour360.com.conf /etc/nginx/sites-available/chat.saastour360.com

# 3. Aktifleştir
sudo ln -s /etc/nginx/sites-available/chat.saastour360.com /etc/nginx/sites-enabled/

# 4. Test et
sudo nginx -t

# 5. Yeniden yükle
sudo systemctl reload nginx
```

**Nginx Config Özeti:**

```nginx
# WebSocket için connection upgrade mapping
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}

server {
    listen 443 ssl http2;
    server_name chat.saastour360.com;

    # Cloudflare Origin Certificate
    ssl_certificate     /etc/ssl/private/saastour360.com/origin.pem;
    ssl_certificate_key /etc/ssl/private/saastour360.com/origin.key;

    # Widget.js
    location /widget.js {
        proxy_pass http://saas-tour-backend:3000/widget.js;  # Container içi port (3000)
        # ... proxy headers
    }

    # WebSocket
    location /socket.io/ {
        proxy_pass http://saas-tour-backend:3000/socket.io/;  # Container içi port (3000)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        # ... proxy headers
    }

    # API
    location /api/chat/widget/ {
        proxy_pass http://saas-tour-backend:3000/api/chat/widget/;  # Container içi port (3000)
        # ... proxy headers + CORS
    }
}
```

#### 5. Test Etme

```bash
# DNS kontrolü
nslookup chat.saastour360.com

# HTTPS test
curl -I https://chat.saastour360.com/widget.js
```

**Beklenen Sonuç:**
```
HTTP/1.1 200 OK
Content-Type: application/javascript
```

---

## 💻 Geliştirme Kılavuzu

### Backend Geliştirme

```bash
cd backend
npm install
npm run dev        # Development mode (ts-node-dev)
npm run build      # Build
npm start          # Production mode
```

### Frontend Geliştirme

```bash
cd frontend
npm install
npm run dev        # Development server
npm run build      # Production build
```

### Import Scripts

#### Destinasyon Import

```bash
cd backend
npm run import:destinations
```

Tüm Türkiye'deki turizm bölgelerini RapidAPI'den import eder.

#### Otel Import

```bash
cd backend
npm run import:hotels -- --city Antalya --limit 100 --radius 5
```

Parametreler:
- `--city`: Şehir adı (Antalya, Side, Kemer, vb.)
- `--limit`: Maksimum sonuç sayısı (default: 50)
- `--radius`: Yarıçap (km) (default: 5)

### Docker Compose Komutları

```bash
# Container'ları başlat
docker-compose up -d

# Container'ları durdur
docker-compose down

# Logları görüntüle
docker-compose logs -f

# Belirli bir service'i yeniden başlat
docker-compose restart backend
docker-compose restart frontend
```

---

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

### Widget.js 404 Hatası

- Backend'in port 4001'de çalıştığını kontrol edin (host port)
- Container içi port 3000 kalır (değiştirilmemeli)
- `/widget.js` endpoint'inin doğru çalıştığını test edin: `curl http://localhost:4001/widget.js`
- Nginx config'inde proxy_pass'in doğru olduğunu kontrol edin

### DNS Çözümlenmiyor

- DNS kaydının eklendiğini kontrol edin
- `dig` veya `nslookup` ile test edin
- DNS cache'i temizleyin

### WebSocket Bağlanamıyor

1. Cloudflare'de WebSocket'in açık olduğunu kontrol edin
2. DNS kaydında Proxy'nin kapalı olduğunu kontrol edin (DNS only)
3. Nginx config'inde WebSocket headers'ının doğru olduğunu kontrol edin
4. Backend'de Socket.io server'ın çalıştığını kontrol edin

### Deployment Başarısız

1. GitHub Actions loglarını kontrol edin
2. Sunucuda `deploy.sh infra` komutunu manuel çalıştırın
3. SSH bağlantısını test edin
4. Secrets'ların doğru eklendiğini kontrol edin

### 502 Bad Gateway Hatası

**Sorun:** Traefik backend container'ına erişemiyor.

**Çözüm:**
1. Container'ların `web` network'üne bağlı olduğunu kontrol edin:
   ```bash
   docker network inspect web
   ```
2. Backend ve Frontend container'larını `web` network'üne bağlayın:
   ```bash
   docker network connect web saas-tour-backend
   docker network connect web saas-tour-frontend
   ```
3. Docker Compose dosyasında network tanımlarını kontrol edin

### HTTPS 502 Bad Gateway

**Sorun:** Cloudflare'den gelen trafik Traefik'e ulaşamıyor.

**Çözüm:**
1. Traefik port ayarlarını kontrol edin (production'da 443:443 olmalı)
2. Certificate resolver'ın çalıştığını kontrol edin
3. `acme.json` dosyasının izinlerini kontrol edin

### Node Modules Sorunu (Sunucuda)

**Sorun:** macOS'ta kurulmuş `node_modules` Linux'ta çalışmıyor.

**Çözüm:**
```bash
# Sunucuda node_modules'i sil
rm -rf frontend/node_modules backend/node_modules

# Docker ile rebuild yap
cd infra
docker-compose down
docker-compose up -d --build
```

### Database Migration Sorunları

**Destinations tenant_id Sorunu:**
```bash
# Production'da fix script'i çalıştır
cd backend
npm run fix:destinations-tenant-sync
```

Bu script:
- NULL değerleri günceller
- Kolonu NOT NULL yapar
- Foreign key constraint ekler

### Container Name Conflict Hatası

**Sorun:** `Error response from daemon: Conflict. The container name "/d70f8adbd74a_saas-tour-backend" is already in use`

**Çözüm:**
`deploy.sh` script'i artık otomatik olarak:
- Eski container'ları temizler
- Docker Compose project prefix'li container'ları kaldırır
- Container'ları kaldırmadan önce durdurur

Eğer hala sorun yaşıyorsanız:
```bash
# Tüm eski container'ları manuel temizle
docker ps -a | grep saas-tour | awk '{print $1}' | xargs docker rm -f
cd infra
docker-compose down --remove-orphans
docker-compose up -d --build
```

---

## 🏭 Production Deployment

### Production Checklist

#### 1. Database Volume Yapılandırması ✅
- ✅ PostgreSQL volume tanımlı: `postgres_data:/var/lib/postgresql/data`
- ✅ `deploy.sh` script'i database verilerini koruyor
- ✅ Normal mod: `docker-compose down` (volume'lar korunur)
- ✅ Fresh DB modu: `docker-compose down -v` (sadece `--fresh-db` ile)

#### 2. DB_SYNC Ayarları ✅
- ✅ Production'da `DB_SYNC=false` olmalı
- ✅ `deploy.sh` script'i otomatik olarak ayarlıyor
- ⚠️ Production'da `backend/.env` dosyasında `DB_SYNC=false` kontrol edin

#### 3. Network Yapılandırması ✅
- ✅ `web` network: External (Traefik için)
- ✅ `global_databases_network`: External (Database bağlantıları için)
- ✅ `saas_tour_internal`: Internal iletişim için

#### 4. Container Restart Politikaları ✅
- ✅ Tüm önemli container'lar: `restart: unless-stopped`
- ✅ Sunucu yeniden başlatıldığında container'lar otomatik başlayacak

### Production Domain Kurulumu

#### DNS Ayarları

**Wildcard A Record (Tüm subdomain'ler için):**
```
Type: A
Name: *
Value: YOUR_SERVER_IP
TTL: 3600
```

**VEYA** her tenant için ayrı ayrı:
```
Type: A
Name: berg
Value: YOUR_SERVER_IP
TTL: 3600
```

#### Traefik Port Ayarları

Production'da Traefik'in port 80 ve 443'ü direkt kullanması gerekiyor:
- Port 80: HTTP
- Port 443: HTTPS
- Let's Encrypt certificate resolver aktif olmalı

#### Multi-Project Database Setup

Aynı sunucuda birden fazla proje çalıştırırken:

**Çözüm:** Tüm projeler aynı database stack'i paylaşmalı
- ✅ Kaynak kullanımı optimize olur
- ✅ Container isim çakışması olmaz
- ✅ Database yönetimi kolaylaşır

**Nasıl Çalışır:**
1. İlk proje database stack'i başlatır
2. İkinci proje mevcut container'ları tespit eder ve kullanır
3. Her iki proje de aynı PostgreSQL/Redis/MongoDB instance'larını kullanır
4. Farklı database'ler kullanarak veriler ayrı tutulur

### Production Ready Summary

✅ **Doğru Yapılandırılmış:**
- Database Volume Yapılandırması
- Network Yapılandırması
- Container Restart Politikaları
- Database Bağlantı Yapılandırması
- Environment Variable Yapısı

✅ **Düzeltilen Sorunlar:**
- DB_SYNC Ayarı (otomatik yönetiliyor)
- Container Name Conflict (deploy.sh'de düzeltildi)

---

## 📧 Email Queue System (RabbitMQ)

Proje email gönderme işlemlerini RabbitMQ kuyruk sistemi üzerinden yönetir.

### Kurulum

1. **Docker Stack'i Başlat:**
   ```bash
   cd docker-datatabse-stack
   docker-compose up -d
   ```

2. **RabbitMQ Management UI:**
   - URL: http://localhost:15672
   - Username: admin
   - Password: admin_pass

3. **Environment Variables:**
   ```env
   RABBITMQ_HOST=localhost
   RABBITMQ_PORT=5672
   RABBITMQ_USER=admin
   RABBITMQ_PASSWORD=admin_pass
   RABBITMQ_VHOST=/
   USE_EMAIL_QUEUE=true
   ```

### Kullanım

**Development:**
```bash
# API Server
npm run dev

# Worker (ayrı terminal)
npm run dev:worker
```

**Production:**
```bash
# API Server
npm start

# Worker (ayrı process)
npm run start:worker
```

### Email Tipleri

- Customer Welcome Email
- Reservation Confirmation
- Reservation Cancelled
- Reservation Completed

### Queue Yapısı

- **Exchange**: `email_exchange` (direct type)
- **Queues**: `email_queue`, `email_queue_high_priority`

### Troubleshooting

- RabbitMQ'nun çalıştığını kontrol edin: `docker ps | grep rabbitmq`
- Worker'ın çalıştığını kontrol edin
- Queue'da mesaj var mı kontrol edin (RabbitMQ Management UI)
- `USE_EMAIL_QUEUE=false` ile fallback mode (direkt gönderim)

---

## 📝 Ek Kaynaklar

- **Backend API Docs**: `/api/docs` (Swagger/OpenAPI)
- **Project Analysis**: Detaylı proje analizi ve iyileştirme önerileri
- **Module Documentation**: Her modül için detaylı dokümantasyon

---

## 📄 Lisans

[Lisans bilgisi buraya eklenecek]

---

**Son Güncelleme:** 2025-12-13  
**Dokümantasyon Versiyonu:** 1.0.0


## 🌱 Seed Komutları

Tüm seed ve import komutları tek bir shell script ile yönetilir. Kullanıcı işlemlerini kolaylaştırmak için tüm komutlar ve açıklamaları:

### 🚀 Hızlı Başlangıç

**Tek Script ile Tüm Seed İşlemleri:**
```bash
./seed.sh [komut]
```

**Yardım:**
```bash
./seed.sh help
```

### Tenant İşlemleri

#### Yeni Tenant Oluşturma
```bash
./seed.sh tenant
```
veya
```bash
cd backend && npm run seed:tenant
```
**Açıklama:** Yeni tenant, tenant settings ve admin kullanıcı oluşturur.  
**Kullanım:** `backend/src/scripts/seed-tenant.ts` dosyasındaki bilgileri güncelleyip çalıştırın.  
**Oluşturduğu:** Tenant, Tenant Settings (site, mail, payment), Tenant User (admin)

### Ana Seed (Tüm Veriler)

#### Tam Seed (Tüm Veriler)
```bash
./seed.sh full
```
veya
```bash
cd backend && npm run seed
```
**Açıklama:** Tüm temel verileri oluşturur (languages, phone countries, tenants, users, destinations, tours, vehicles, vb.)

### Mock/Test Verileri

#### Mock Data Seed
```bash
./seed.sh mock
```
veya
```bash
cd backend && npm run seed:mock
```
**Açıklama:** Test için mock veriler oluşturur (tours, vehicles, reservations, vb.)

#### Global Destinations & Hotels Seed
```bash
./seed.sh global
```
veya
```bash
cd backend && npm run seed:global
```
**Açıklama:** Global destinasyonlar ve otelleri seed eder

### Import İşlemleri

#### Destinasyon Import (RapidAPI)
```bash
./seed.sh import:destinations
```
veya
```bash
cd backend && npm run import:destinations
```
**Açıklama:** RapidAPI'den Türkiye'deki turizm bölgelerini import eder

#### Otel Import (RapidAPI)
```bash
./seed.sh import:hotels --city Antalya --limit 100 --radius 5
```
veya
```bash
cd backend && npm run import:hotels -- --city Antalya --limit 100 --radius 5
```
**Açıklama:** RapidAPI'den belirli bir şehir için otelleri import eder  
**Parametreler:**
- `--city`: Şehir adı (örn: Antalya, Side, Kemer)
- `--limit`: Maksimum sonuç sayısı (default: 50)
- `--radius`: Yarıçap (km) (default: 5)

### Rentacar Seed İşlemleri

#### Vehicle Brands & Models Seed
```bash
./seed.sh vehicles
```
veya
```bash
cd backend && npm run seed:vehicles
```
**Açıklama:** Araç markaları ve modellerini seed eder

#### Vehicle Variations Seed
```bash
./seed.sh vehicle-variations
```
veya
```bash
cd backend && npm run seed:vehicle-variations
```
**Açıklama:** Araç varyasyonlarını seed eder

#### Vehicle Plates Seed
```bash
./seed.sh vehicle-plates
```
veya
```bash
cd backend && npm run seed:vehicle-plates
```
**Açıklama:** Araç plakalarını seed eder

### Lokasyon Seed İşlemleri

#### Türkiye İlleri Seed
```bash
./seed.sh provinces
```
veya
```bash
cd backend && npm run seed:provinces
```
**Açıklama:** Türkiye'nin tüm illerini seed eder

#### İl Alt Lokasyonları Seed
```bash
./seed.sh province-sub-locations
```
veya
```bash
cd backend && npm run seed:province-sub-locations
```
**Açıklama:** İllerin alt lokasyonlarını (ilçeler, mahalleler) seed eder

### Email Template Seed

#### Customer Welcome Email Template
```bash
./seed.sh customer-welcome
```
veya
```bash
cd backend && npm run seed:customer-welcome
```
**Açıklama:** Müşteri hoş geldin email template'ini oluşturur

### Fix/Migration İşlemleri

#### Destinations Tenant ID Sync Fix
```bash
./seed.sh fix:destinations
```
veya
```bash
cd backend && npm run fix:destinations-tenant-sync
```
**Açıklama:** Synchronize sonrası destinations tenant_id sorunlarını düzeltir (NULL değerleri günceller, NOT NULL yapar)

### Kullanım Örnekleri

#### Yeni Tenant Ekleme
1. `backend/src/scripts/seed-tenant.ts` dosyasını açın
2. `TENANT_CONFIG`, `ADMIN_USER`, `SITE_SETTINGS` bilgilerini güncelleyin
3. `./seed.sh tenant` çalıştırın

#### İlk Kurulum (Tüm Veriler)
```bash
# 1. Temel veriler
./seed.sh full

# 2. Global destinations & hotels
./seed.sh global

# 3. Lokasyonlar
./seed.sh provinces
./seed.sh province-sub-locations

# 4. Rentacar verileri
./seed.sh vehicles
./seed.sh vehicle-variations
```

#### Test Ortamı İçin Mock Veriler
```bash
./seed.sh mock
```

### Script Özellikleri

- **Otomatik Docker Algılama:** Docker container çalışıyorsa otomatik olarak container içinde çalıştırır
- **Yerel Ortam Desteği:** Docker yoksa yerel ortamda çalışır
- **Renkli Çıktı:** İşlem durumunu gösteren renkli mesajlar
- **Yardım Sistemi:** `./seed.sh help` ile tüm komutları görebilirsiniz

### Notlar

- Script proje root dizininden çalıştırılmalıdır (`./seed.sh`)
- Production'da seed çalıştırmadan önce backup alın
- `seed:tenant` komutu mevcut tenant kontrolü yapar (aynı slug varsa uyarı verir)
- Import komutları RapidAPI key gerektirir (`.env` dosyasında `RAPIDAPI_KEY`)
- Docker kullanıyorsanız, backend container'ının çalışıyor olması gerekir