#!/bin/bash

# SaaS Tour - Manuel Sunucu Deployment
# Windows/Git Bash üzerinde çalışır - Line endings otomatik düzeltilir

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
echo "   4. Line endings düzelt (Windows -> Linux)"
echo "   5. Container'ları rebuild et"
echo "   6. Health check yap"
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

# Backend dist
echo -e "${YELLOW}1/6 Backend dist yükleniyor...${NC}"
scp -r backend/dist ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/backend/ || { echo -e "${RED}❌ Hata${NC}"; exit 1; }
echo -e "${GREEN}✅ Backend dist yüklendi${NC}"

# Backend config
echo -e "${YELLOW}2/6 Backend config yükleniyor...${NC}"
scp backend/package.json backend/package-lock.json backend/Dockerfile.production ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/backend/ || { echo -e "${RED}❌ Hata${NC}"; exit 1; }
echo -e "${GREEN}✅ Backend config yüklendi${NC}"

# Frontend dist
echo -e "${YELLOW}3/6 Frontend dist yükleniyor...${NC}"
scp -r frontend/dist ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/frontend/ || { echo -e "${RED}❌ Hata${NC}"; exit 1; }
echo -e "${GREEN}✅ Frontend dist yüklendi${NC}"

# Frontend nginx ve config
echo -e "${YELLOW}4/6 Frontend nginx ve config yükleniyor...${NC}"
scp -r frontend/nginx ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/frontend/ || { echo -e "${RED}❌ Hata${NC}"; exit 1; }
scp frontend/Dockerfile.production ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/frontend/ || { echo -e "${RED}❌ Hata${NC}"; exit 1; }
echo -e "${GREEN}✅ Frontend nginx yüklendi${NC}"

# Infra klasörü
echo -e "${YELLOW}5/6 Infra klasörü yükleniyor...${NC}"
scp -r infra ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/ || { echo -e "${RED}❌ Hata${NC}"; exit 1; }
echo -e "${GREEN}✅ Infra yüklendi${NC}"

# Worker dist ve config (backend ile aynı)
echo -e "${YELLOW}6/6 Worker config yükleniyor...${NC}"
ssh ${REMOTE_USER}@${REMOTE_HOST} "mkdir -p ${REMOTE_PATH}/worker && cp -r ${REMOTE_PATH}/backend/dist ${REMOTE_PATH}/worker/ && cp ${REMOTE_PATH}/backend/package.json ${REMOTE_PATH}/worker/ && cp ${REMOTE_PATH}/backend/package-lock.json ${REMOTE_PATH}/worker/ && cp ${REMOTE_PATH}/backend/Dockerfile.production ${REMOTE_PATH}/worker/"
echo -e "${GREEN}✅ Worker config yüklendi${NC}"

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
rm -rf frontend/src backend/src frontend1 mobile postman scripts .git .github .vscode 2>/dev/null || true
find . -maxdepth 2 -type f \\( -name '*.md' -o -name '*.MD' -o -name '*.sql' -o -name '.env.example' -o -name 'tsconfig*.json' -o -name '*.ps1' \\) -delete 2>/dev/null || true
echo -e \"\${GREEN}✅ Temizlik tamamlandı\${NC}\"
echo ''

# Docker container rebuild
echo -e \"\${YELLOW}🔨 Container'lar rebuild ediliyor...\${NC}\"
cd infra

# Container'ları durdur ve kaldır
echo -e \"   • Eski container'lar durduruluyor...\"
docker-compose stop frontend backend worker 2>/dev/null || true
docker-compose rm -f frontend backend worker 2>/dev/null || true

# Docker cache temizle (eski image'ları kaldır)
echo -e \"   • Docker cache temizleniyor...\"
docker image prune -f 2>/dev/null || true

# Yeniden build et (inline env variables ile)
echo -e \"   • Yeni image'lar build ediliyor (Dockerfile.production)...\"
BACKEND_DOCKERFILE=Dockerfile.production FRONTEND_DOCKERFILE=Dockerfile.production docker-compose build --no-cache frontend backend worker

# Container'ları başlat (inline env variables ile)
echo -e \"   • Container'lar başlatılıyor...\"
BACKEND_DOCKERFILE=Dockerfile.production FRONTEND_DOCKERFILE=Dockerfile.production docker-compose up -d frontend backend worker

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
    
    # Assets kontrolü
    ASSETS_COUNT=\$(docker exec saas-tour-frontend ls /usr/share/nginx/html/assets/ 2>/dev/null | wc -l)
    if [ \"\$ASSETS_COUNT\" -gt 0 ]; then
        echo -e \"   \${GREEN}✅ Frontend assets: \$ASSETS_COUNT dosya mevcut\${NC}\"
    else
        echo -e \"   \${RED}⚠️  Frontend assets bulunamadı!\${NC}\"
    fi
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

# Disk kullanımı
echo -e \"\${BLUE}💾 Disk Kullanımı:\${NC}\"
df -h \${REMOTE_PATH} | tail -1 | awk '{print \"   Kullanılan: \"\$3\" / Toplam: \"\$2\" (\"\$5\" dolu)\"}'
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
echo -e "${YELLOW}⚠️  NOT: Cloudflare cache'ini temizlemeyi unutmayın!${NC}"
echo ""
