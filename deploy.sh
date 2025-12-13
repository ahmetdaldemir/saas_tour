#!/bin/bash

# Otomatik Deployment Script
# Hem local hem sunucuda çalışır - tek komutla tüm kurulumu yapar
#
# Kullanım:
#   ./deploy.sh              - Tam deployment (npm install + build + docker up)
#   ./deploy.sh build        - Sadece Docker build (container'lar çalışıyorsa)
#   ./deploy.sh infra        - Sadece infra stack'ini build et
#   ./deploy.sh full         - Tam deployment (npm install dahil)
#   ./deploy.sh seed         - Database seed çalıştır (Docker container içinden)
#   ./deploy.sh seed:global  - Global destinations/hotels seed çalıştır

set -e

# Renkli output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Komut satırı argümanı
MODE=${1:-full}

echo -e "${BLUE}🚀 SaaS Tour Platform Deployment${NC}"
echo "================================"
echo ""

# Proje dizinini bul
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Container durumu kontrolü fonksiyonu
check_containers_running() {
    local containers=("saas-tour-backend" "saas-tour-frontend" "global_postgres")
    local all_running=true
    
    for container in "${containers[@]}"; do
        if ! docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
            all_running=false
            break
        fi
    done
    
    echo $all_running
}

# Container durumu kontrolü
CONTAINERS_RUNNING=$(check_containers_running)

# Seed modu kontrolü
if [ "$MODE" = "seed" ] || [ "$MODE" = "seed:global" ]; then
    echo -e "${YELLOW}🌱 Seed modu: $MODE${NC}"
    
    # Backend container'ının çalıştığını kontrol et
    if ! docker ps --format '{{.Names}}' | grep -q "^saas-tour-backend$"; then
        echo -e "${RED}❌ Backend container çalışmıyor! Önce ./deploy.sh ile container'ları başlatın.${NC}"
        exit 1
    fi
    
    if [ "$MODE" = "seed" ]; then
        echo -e "${YELLOW}🌱 Ana seed script'i çalıştırılıyor...${NC}"
        docker exec -it saas-tour-backend node dist/seeds/seed.js
    elif [ "$MODE" = "seed:global" ]; then
        echo -e "${YELLOW}🌱 Global destinations/hotels seed çalıştırılıyor...${NC}"
        docker exec -it saas-tour-backend node dist/scripts/seed-global-destinations-hotels.js
    fi
    
    echo -e "${GREEN}✅ Seed tamamlandı!${NC}"
    exit 0
fi

# Mod kontrolü ve npm build işlemleri
if [ "$MODE" = "build" ] || [ "$MODE" = "infra" ]; then
    if [ "$CONTAINERS_RUNNING" = "true" ]; then
        echo -e "${GREEN}✅ Container'lar çalışıyor, sadece Docker build yapılacak${NC}"
        SKIP_NPM_BUILD=true
    else
        echo -e "${YELLOW}⚠️  Container'lar çalışmıyor, npm build gerekli${NC}"
        SKIP_NPM_BUILD=false
    fi
elif [ "$MODE" = "full" ]; then
    SKIP_NPM_BUILD=false
    echo -e "${YELLOW}📦 Tam deployment modu - npm install ve build yapılacak${NC}"
else
    echo -e "${RED}❌ Geçersiz mod: $MODE${NC}"
    echo "Kullanım: ./deploy.sh [build|infra|full|seed|seed:global]"
    exit 1
fi

# 1. Backend npm install ve build (sadece gerekirse)
if [ "$SKIP_NPM_BUILD" = "false" ] && [ "$MODE" != "infra" ]; then
    echo -e "${YELLOW}📦 Backend dependencies yükleniyor...${NC}"
    cd backend
    if [ ! -d "node_modules" ]; then
        echo "npm install çalıştırılıyor..."
        npm install
    else
        echo "node_modules mevcut, kontrol ediliyor..."
    fi
    echo -e "${YELLOW}🔨 Backend build ediliyor...${NC}"
    npm run build
    echo -e "${GREEN}✅ Backend hazır${NC}"
    cd ..
else
    echo -e "${BLUE}⏭️  Backend npm build atlandı${NC}"
fi

# 2. Frontend npm install ve build (sadece gerekirse)
if [ "$SKIP_NPM_BUILD" = "false" ] && [ "$MODE" != "infra" ]; then
    echo -e "${YELLOW}📦 Frontend dependencies yükleniyor...${NC}"
    cd frontend
    if [ ! -d "node_modules" ]; then
        echo "npm install çalıştırılıyor..."
        npm install
    else
        echo "node_modules mevcut, kontrol ediliyor..."
    fi
    echo -e "${YELLOW}🔨 Frontend build ediliyor...${NC}"
    npm run build
    echo -e "${GREEN}✅ Frontend hazır${NC}"
    cd ..
else
    echo -e "${BLUE}⏭️  Frontend npm build atlandı${NC}"
fi

# 3. Database Stack kontrolü ve başlatma (sadece full mod veya çalışmıyorsa)
if [ "$MODE" = "full" ] || [ "$CONTAINERS_RUNNING" = "false" ]; then
    echo -e "${YELLOW}🗄️  Database Stack kontrol ediliyor...${NC}"
    cd docker-datatabse-stack

    # .env dosyası kontrolü
    if [ ! -f ".env" ]; then
        if [ -f "env.example" ]; then
            echo -e "${YELLOW}⚠️  .env dosyası bulunamadı, env.example'dan oluşturuluyor...${NC}"
            cp env.example .env
            echo -e "${YELLOW}📝 Lütfen .env dosyasını düzenleyin ve tekrar çalıştırın${NC}"
        else
            echo -e "${RED}❌ .env dosyası bulunamadı ve env.example yok!${NC}"
            exit 1
        fi
    fi

    # Database stack'i başlat
    echo -e "${YELLOW}🚀 Database Stack başlatılıyor...${NC}"
    docker-compose up -d

    # PostgreSQL'in hazır olmasını bekle
    echo -e "${YELLOW}⏳ PostgreSQL'in hazır olması bekleniyor...${NC}"
    timeout=30
    counter=0
    until docker exec global_postgres pg_isready -U ${POSTGRES_USER:-dev_user} > /dev/null 2>&1; do
        sleep 1
        counter=$((counter + 1))
        if [ $counter -ge $timeout ]; then
            echo -e "${RED}❌ PostgreSQL başlatılamadı${NC}"
            exit 1
        fi
    done
    echo -e "${GREEN}✅ Database Stack hazır${NC}"
    cd ..
else
    echo -e "${BLUE}⏭️  Database Stack kontrolü atlandı (zaten çalışıyor)${NC}"
fi

# 4. Backend .env kontrolü (sadece full mod)
if [ "$MODE" = "full" ]; then
    echo -e "${YELLOW}🔍 Backend .env kontrol ediliyor...${NC}"
    cd backend
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            echo -e "${YELLOW}⚠️  .env dosyası bulunamadı, .env.example'dan oluşturuluyor...${NC}"
            cp .env.example .env
            echo -e "${YELLOW}📝 Lütfen backend/.env dosyasını düzenleyin${NC}"
        else
            echo -e "${RED}❌ backend/.env dosyası bulunamadı!${NC}"
            exit 1
        fi
    fi
    cd ..
fi

# 5. Infra (Backend + Frontend) başlatma
if [ "$MODE" = "build" ] || [ "$MODE" = "infra" ] || [ "$MODE" = "full" ]; then
    echo -e "${YELLOW}🚀 Application Stack ${MODE} modunda başlatılıyor...${NC}"
    cd infra

    # Environment variables ayarla
    export NODE_ENV=production
    export BACKEND_PORT=4001
    export FRONTEND_PORT=9001
    export DB_HOST=global_postgres
    export DB_PORT=${DB_PORT:-5432}
    export DB_USERNAME=${DB_USERNAME:-dev_user}
    export DB_PASSWORD=${DB_PASSWORD:-dev_pass}
    export DB_NAME=${DB_NAME:-tour_saas}

    # Docker network kontrolü (global_databases_network zaten var olmalı)
    if ! docker network ls | grep -q "global_databases_network"; then
        echo -e "${RED}❌ global_databases_network bulunamadı!${NC}"
        exit 1
    fi

    if [ "$MODE" = "build" ] || [ "$MODE" = "infra" ]; then
        # Sadece build modunda - container'ları durdurma, sadece rebuild
        echo -e "${YELLOW}🔨 Container'lar rebuild ediliyor...${NC}"
        docker-compose up -d --build
    else
        # Full modunda - container'ları durdur ve yeniden başlat
        docker-compose down 2>/dev/null || true
        docker-compose up -d --build
    fi

    # Backend'in başlamasını bekle
    echo -e "${YELLOW}⏳ Backend'in başlaması bekleniyor...${NC}"
    sleep 5
else
    echo -e "${RED}❌ Geçersiz mod: $MODE${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Deployment tamamlandı!${NC}"
echo ""
echo -e "${BLUE}📊 Durum:${NC}"
docker-compose ps

echo ""
echo -e "${BLUE}🌐 Erişim:${NC}"
echo -e "   Backend API:  ${GREEN}http://localhost:4001/api${NC}"
echo -e "   Frontend:     ${GREEN}http://localhost:9001${NC}"
echo ""
echo -e "${BLUE}📝 Loglar:${NC}"
echo "   docker-compose logs -f backend"
echo "   docker-compose logs -f frontend"
echo ""
echo -e "${BLUE}🔍 Database Migration Durumu:${NC}"
echo "   docker logs saas-tour-backend | grep -i migration"
echo ""

cd ..
