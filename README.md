# SaaS Tour Platform

Monorepo tasarımında Node.js (TypeORM) backend ve Vue.js frontend içeren çok kiracılı (multi-tenant) tur ve araç kiralama SaaS projesi.

## İçerik

- ackend/: Express + TypeORM tabanlı API
- rontend/: Vue 3 + Vite yönetim paneli (Nginx ile servis edilir)
- infra/: Docker Compose ve altyapı konfigürasyonları (docker-compose.yml yerel, docker-compose.prod.yml üretim)

## Backend

- Tenants, Destinations, Hotels, Blogs, PhoneCountry, PaymentMethod, Reservations, Operations, Language modülleri
- Tour ve Rentacar için domain servisleri ve iş kuralları
- TypeORM PostgreSQL entegrasyonu (AppDataSource)
- 
pm run dev ile yerel geliştirme, 
pm run build/
pm start ile üretim

### Çevresel Değişkenler

.env.example üzerinde örnek değerler bulunmaktadır:

`
NODE_ENV=development
APP_PORT=3000
DB_HOST=database
DB_PORT=5432
DB_USERNAME=tour_admin
DB_PASSWORD=tour_admin
DB_NAME=tour_saas
`

Yerel Docker Compose senaryosunda bu değerler otomatik atanır, manuel çalıştırmalarda .env olarak kopyalayıp düzenleyin.

## Frontend

- Vue Router ile Dashboard, Tours, Rentacar sayfaları
- Axios tabanlı /api istemcisi (Nginx reverse proxy üzerinden backend’e yönlenir)
- 
pm run dev ile geliştirme, 
pm run build ile prod derleme

## Docker

### Yerel Kurulum

`
cd infra
docker compose up -d --build
`

Bu stack; Postgres (db), API (ackend) ve Nginx üzerinden statik frontend (rontend) konteynerlerini aynı ağda (saas_tour_local) ayağa kaldırır:

- Backend: http://localhost:3000
- Frontend (Nginx + SPA proxy): http://localhost:8080

### Üretim (Nginx Proxy + Cloudflare ağı)

Mevcut canlı altyapıyla entegre çalışması için docker-compose.prod.yml dosyasını kullanın. Bu dosya, docker-database-stack_default ve 
ginx-proxy-cloudflare-full_default ağlarına bağlanır. Ortamınıza göre aşağıdaki adımları takip edin:

`
cd infra
docker compose -f docker-compose.prod.yml up -d --build
`

> VIRTUAL_HOST, LETSENCRYPT_HOST, LETSENCRYPT_EMAIL değerlerini live ortamınıza göre güncelleyin ve harici ağların isimlerini doğrulayın.

## Destination import (RapidAPI)

1. RapidAPI portalından Travel Advisor servisi için anahtar alın ve `backend/.env` dosyasına ekleyin:
   ```
   RAPIDAPI_KEY=<rapid_api_key>
   RAPIDAPI_TRAVEL_ADVISOR_HOST=travel-advisor.p.rapidapi.com
   ```
2. Tüm Türkiye’deki turizm bölgelerini içeren ön tanımlı listeyi (global olarak) import etmek için:
   ```
   cd backend
   npm run import:destinations
   ```
   Komut, şehir listesinde (Istanbul, Antalya, Bodrum, Kas, Pamukkale vb.) gezerek RapidAPI’den çektiği noktaları sisteme global destinasyonlar olarak kaydeder; sonuçlar konsolda `imported/skipped` şeklinde özetlenir.

3. Belirli bir şehirdeki otelleri toplu import etmek için:
   ```
   cd backend
   npm run import:hotels -- --city Antalya --limit 100 --radius 5
   ```
   - `--city`: RapidAPI üzerinden aratılacak şehir. (Side, Kemer gibi alt destinasyonlar için her biri ayrı çağrılabilir.)
   - `--country`: (Opsiyonel) Şehir ile beraber gönderilecek ülke filtresi.
   - `--radius`: Kilometre cinsinden yarıçap (varsayılan 5 km).
   - `--limit`: Çekilecek maksimum sonuç sayısı (varsayılan 50).
   Script, TripAdvisor hotels endpoint’inden dönen kayıtları global destinasyon/otel tablolarına kaydeder; mevcut isim+şehir+ülke kombinasyonu varsa `skipped` olarak raporlar.
3. Panel üzerinden tek seferlik import isterseniz aynı REST endpoint’ini kullanabilirsiniz:
   ```
   POST /api/destinations/import
   Authorization: Bearer <JWT>
   {
     "city": "Istanbul",
     "radius": 20,
     "limit": 30
   }
   ```

## Sonraki Adımlar

- TypeORM migration’ları ve başlangıç seed verilerini ekleyerek şemayı güvenceye alın.
- Kimlik doğrulama/yetkilendirme, ödeme sağlayıcı konfigürasyonları ve e-posta bildirim servislerini entegrasyon için planlayın.
- CI/CD pipeline ve test otomasyonunu proje akışına dahil edin.
