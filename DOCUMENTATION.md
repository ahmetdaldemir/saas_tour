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

| Secret Adı | Değer | Açıklama |
|------------|-------|----------|
| `SFTP_HOST` | `185.209.228.189` | Sunucu IP adresi |
| `SFTP_USERNAME` | `root` | SSH/SFTP kullanıcı adı |
| `SFTP_PASSWORD` | `@198711Ad@` | SSH/SFTP şifresi |
| `SFTP_PORT` | `22` | SSH port |
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
   IPv4 address: 185.209.228.189
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

