# Seed Komutları - Hızlı Referans

## 🚀 Docker Container İçinde (Önerilen)

```bash
# Customer Welcome Email Template
docker exec -it saas-tour-backend node dist/scripts/seed-customer-welcome-template.js

# Ana Seed
docker exec -it saas-tour-backend node dist/seeds/seed.js

# Global Destinations/Hotels
docker exec -it saas-tour-backend node dist/scripts/seed-global-destinations-hotels.js

# Mock Data
docker exec -it saas-tour-backend node dist/scripts/seed-mock-data.js
```

## 💻 Yerel Ortamda

```bash
cd backend

# Customer Welcome Email Template
npm run seed:customer-welcome

# Ana Seed
npm run seed

# Mock Data
npm run seed:mock

# Global Seed
npm run seed:global

# Import Destinations
npm run import:destinations

# Import Hotels
npm run import:hotels
```

## 📦 Deploy Script ile

```bash
# Ana Seed
./deploy.sh seed

# Global Seed
./deploy.sh seed:global
```
