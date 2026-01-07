#!/bin/bash

# SaaS Tour - Manuel Sunucu Deployment
# Windows/Git Bash üzerinde çalışır

# Renkli output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}🚀 SaaS Tour - Otomatik Sunucu Deployment${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Sunucu bilgileri
REMOTE_HOST="185.209.228.189"
REMOTE_USER="root"
REMOTE_PATH="/var/www/html/saastour360"

echo -e "${YELLOW}📋 Bu script şu adımları gerçekleştirecek:${NC}"
echo "   1. Backend testleri çalıştır"
echo "   2. Frontend build (npm run build)"
echo "   3. Dosyaları sunucuya yükle"
echo "   4. Container'ları rebuild et"
echo "   5. Health check yap"
echo ""
echo -e "${YELLOW}⚠️  NOT: SSH şifresi istenecek${NC}"
echo ""
read -p "Devam etmek istiyor musunuz? (y/n): " confirm

if [ "$confirm" != "y" ]; then
    echo -e "${RED}❌ İşlem iptal edildi${NC}"
    exit 0
fi

echo ""

# 1. Backend Tests
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}🧪 BACKEND TESTLER ÇALIŞTIRILIYOR${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${YELLOW}Running backend tests...${NC}"
cd backend
npm test
TEST_EXIT_CODE=$?
cd ..

if [ $TEST_EXIT_CODE -ne 0 ]; then
    echo ""
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}❌ TESTLER BAŞARISIZ! DEPLOYMENT DURDURULDU!${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  Lütfen testleri düzeltin ve tekrar deneyin.${NC}"
    echo -e "${YELLOW}   Test detayları için: cd backend && npm test${NC}"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Tüm testler başarılı!${NC}"
echo ""

# 2. Frontend Build
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}📦 FRONTEND BUILD${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${YELLOW}Building frontend...${NC}"
cd frontend
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Frontend build başarısız!${NC}"
    exit 1
fi
cd ..
echo -e "${GREEN}✅ Frontend build tamamlandı${NC}"
echo ""

# 3. Dosyaları Yükle
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}📤 DOSYALAR SUNUCUYA YÜKLENIYOR${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Backend (src dahil - Docker içinde build edilecek)
echo -e "${YELLOW}1/4 Backend yükleniyor...${NC}"
scp -r backend/src backend/package.json backend/package-lock.json backend/tsconfig.json backend/Dockerfile backend/public ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/backend/ || { echo -e "${RED}❌ Hata${NC}"; exit 1; }
echo -e "${GREEN}✅ Backend yüklendi${NC}"

# Frontend (src + config + nginx + Dockerfile)
echo -e "${YELLOW}2/4 Frontend yükleniyor...${NC}"
scp -r frontend/src frontend/nginx frontend/Dockerfile frontend/package.json frontend/package-lock.json frontend/tsconfig.json frontend/tsconfig.node.json frontend/vite.config.ts frontend/index.html ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/frontend/ || { echo -e "${RED}❌ Hata${NC}"; exit 1; }
echo -e "${GREEN}✅ Frontend yüklendi${NC}"

# Infra
echo -e "${YELLOW}3/4 Infra klasörü yükleniyor...${NC}"
scp -r infra ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/ || { echo -e "${RED}❌ Hata${NC}"; exit 1; }
echo -e "${GREEN}✅ Infra yüklendi${NC}"

# Deploy script
echo -e "${YELLOW}4/4 Deploy script yükleniyor...${NC}"
scp deploy.sh ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/ || { echo -e "${RED}❌ Hata${NC}"; exit 1; }
echo -e "${GREEN}✅ Deploy script yüklendi${NC}"

echo ""
echo -e "${GREEN}✅ Tüm dosyalar yüklendi${NC}"
echo ""

# 4. Sunucuda Deployment
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}🚀 SUNUCUDA DEPLOYMENT${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

ssh ${REMOTE_USER}@${REMOTE_HOST} "
set -e

REMOTE_PATH='/var/www/html/saastour360'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

cd \${REMOTE_PATH}

echo -e \"\${BLUE}📍 Sunucu: \$(hostname)\${NC}\"
echo -e \"\${BLUE}⏰ Zaman: \$(date '+%Y-%m-%d %H:%M:%S')\${NC}\"
echo ''

# Production temizliği
echo -e \"\${YELLOW}🧹 Production temizliği...\${NC}\"
rm -rf frontend1 mobile postman scripts .git .github .vscode 2>/dev/null || true
find . -maxdepth 2 -type f \\( -name '*.md' -o -name '*.MD' -o -name '*.sql' -o -name '.env.example' -o -name '*.ps1' \\) -delete 2>/dev/null || true
echo -e \"\${GREEN}✅ Temizlik tamamlandı\${NC}\"
echo ''

# Docker container rebuild
echo -e \"\${YELLOW}🔨 Container'lar rebuild ediliyor...\${NC}\"
cd infra

# Container'ları durdur ve kaldır
echo -e \"   • Eski container'lar durduruluyor...\"
docker-compose stop frontend backend worker 2>/dev/null || true
docker-compose rm -f frontend backend worker 2>/dev/null || true

# Yeniden build et
echo -e \"   • Yeni image'lar build ediliyor...\"
docker-compose build --no-cache frontend backend worker

# Container'ları başlat
echo -e \"   • Container'lar başlatılıyor...\"
docker-compose up -d frontend backend worker

echo -e \"\${GREEN}✅ Container'lar başlatıldı\${NC}\"
echo ''

# Bekleme
echo -e \"\${YELLOW}⏳ Container'ların hazır olması bekleniyor (10 saniye)...\${NC}\"
sleep 10

# Health check
echo ''
echo -e \"\${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\${NC}\"
echo -e \"\${CYAN}🏥 HEALTH CHECK\${NC}\"
echo -e \"\${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\${NC}\"
echo ''

# Container durumları
docker-compose ps

echo ''

# Backend check
if docker ps --format '{{.Names}}' | grep -q '^saas-tour-backend\$'; then
    echo -e \"\${GREEN}✅ Backend: Çalışıyor\${NC}\"
else
    echo -e \"\${RED}❌ Backend: Çalışmıyor!\${NC}\"
fi

# Frontend check
if docker ps --format '{{.Names}}' | grep -q '^saas-tour-frontend\$'; then
    echo -e \"\${GREEN}✅ Frontend: Çalışıyor\${NC}\"
else
    echo -e \"\${RED}❌ Frontend: Çalışmıyor!\${NC}\"
fi

# Database check
if docker ps --format '{{.Names}}' | grep -q '^global_postgres\$'; then
    echo -e \"\${GREEN}✅ PostgreSQL: Çalışıyor\${NC}\"
else
    echo -e \"\${RED}❌ PostgreSQL: Çalışmıyor!\${NC}\"
fi

# Traefik check
if docker ps --format '{{.Names}}' | grep -q '^traefik\$'; then
    echo -e \"\${GREEN}✅ Traefik: Çalışıyor\${NC}\"
else
    echo -e \"\${RED}❌ Traefik: Çalışmıyor!\${NC}\"
fi

echo ''

echo -e \"\${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\${NC}\"
echo -e \"\${GREEN}✅ DEPLOYMENT TAMAMLANDI!\${NC}\"
echo -e \"\${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\${NC}\"
"

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 DEPLOYMENT TAMAMLANDI!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}🌐 Production URL'leri:${NC}"
echo -e "   • ${GREEN}https://saastour360.com${NC}"
echo -e "   • ${GREEN}https://sunset.saastour360.com${NC}"
echo -e "   • ${GREEN}https://berg.saastour360.com${NC}"
echo ""
