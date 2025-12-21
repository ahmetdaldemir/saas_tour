#!/bin/bash

# Multi-Tenant SaaS Platform - Comprehensive Deployment Script
# Database verilerini koruyarak tüm mimariyi yeni baştan çalıştırır
#
# Kullanım:
#   ./deploy.sh              - Tam deployment (veriler korunur)
#   ./deploy.sh --fresh-db   - Database'i sıfırdan kurar (DİKKAT: Tüm veriler silinir!)
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
CYAN='\033[0;36m'
NC='\033[0m'

# Komut satırı argümanları
MODE=${1:-full}
FRESH_DB=false

# --fresh-db parametresi kontrolü
if [[ "$*" == *"--fresh-db"* ]]; then
    FRESH_DB=true
    echo -e "${RED}⚠️  UYARI: --fresh-db parametresi aktif! Database tüm verileriyle birlikte silinecek!${NC}"
    read -p "Devam etmek istediğinize emin misiniz? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        echo -e "${YELLOW}❌ İşlem iptal edildi${NC}"
        exit 0
    fi
fi

echo -e "${BLUE}🚀 SaaS Tour Platform - Multi-Tenant Deployment${NC}"
echo "============================================================"
echo ""

# Proje dizinini bul
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Container durumu kontrolü fonksiyonu
check_containers_running() {
    local containers=("saas-tour-backend" "saas-tour-frontend" "global_postgres" "traefik")
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
    echo "Kullanım: ./deploy.sh [build|infra|full|seed|seed:global] [--fresh-db]"
    exit 1
fi

# ============================================================
# 1. DATABASE STACK - Verileri koruyarak başlat
# ============================================================
if [ "$MODE" = "full" ] || [ "$CONTAINERS_RUNNING" = "false" ]; then
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}🗄️  DATABASE STACK${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
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

    # Mevcut çalışan container'ları kontrol et
    RUNNING_POSTGRES=$(docker ps --format "{{.Names}}" | grep -q "^global_postgres$" && echo "yes" || echo "no")
    
    if [ "$RUNNING_POSTGRES" = "yes" ]; then
        echo -e "${YELLOW}⚠️  Database container'ları zaten çalışıyor (muhtemelen başka bir proje tarafından kullanılıyor)${NC}"
        echo -e "${GREEN}💾 Mevcut container'lar korunacak ve paylaşılacak${NC}"
        
        # Sadece eksik container'ları başlat (docker-compose bunu otomatik yapar)
        echo -e "${YELLOW}🚀 Eksik container'lar kontrol ediliyor ve başlatılıyor...${NC}"
        docker-compose up -d
    else
        # Container'lar çalışmıyor - normal akış
        if [ "$FRESH_DB" = "true" ]; then
            echo -e "${RED}🗑️  Database sıfırdan kuruluyor (tüm veriler silinecek!)...${NC}"
            docker-compose down -v 2>/dev/null || true
            echo -e "${YELLOW}⏳ 5 saniye bekleniyor...${NC}"
            sleep 5
        else
            echo -e "${GREEN}💾 Database verileri korunacak${NC}"
            docker-compose down 2>/dev/null || true
        fi
        
        # Database stack'i başlat
        echo -e "${YELLOW}🚀 Database Stack başlatılıyor...${NC}"
        docker-compose up -d
    fi

    # PostgreSQL'in hazır olmasını bekle
    echo -e "${YELLOW}⏳ PostgreSQL'in hazır olması bekleniyor...${NC}"
    timeout=60
    counter=0
    until docker exec global_postgres pg_isready -U ${POSTGRES_USER:-dev_user} > /dev/null 2>&1; do
        sleep 1
        counter=$((counter + 1))
        if [ $counter -ge $timeout ]; then
            echo -e "${RED}❌ PostgreSQL başlatılamadı (${timeout}s timeout)${NC}"
            exit 1
        fi
        echo -n "."
    done
    echo ""
    echo -e "${GREEN}✅ Database Stack hazır${NC}"
    cd ..
else
    echo -e "${BLUE}⏭️  Database Stack kontrolü atlandı (zaten çalışıyor)${NC}"
fi

# ============================================================
# 2. WEB NETWORK - Traefik için external network
# ============================================================
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}🌐 WEB NETWORK (Traefik)${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if ! docker network ls | grep -q "web"; then
    echo -e "${YELLOW}🌐 Web network oluşturuluyor...${NC}"
    docker network create web
    echo -e "${GREEN}✅ Web network oluşturuldu${NC}"
else
    echo -e "${GREEN}✅ Web network zaten mevcut${NC}"
fi

# ============================================================
# 3. TRAEFIK - Reverse proxy ve SSL yönetimi
# ============================================================
if [ "$MODE" = "full" ] || [ "$CONTAINERS_RUNNING" = "false" ]; then
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}🔀 TRAEFIK (Reverse Proxy & SSL)${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    # infra/traefik dizininin varlığını kontrol et
    if [ ! -d "infra/traefik" ]; then
        echo -e "${RED}❌ Hata: infra/traefik dizini bulunamadı!${NC}"
        echo -e "${YELLOW}💡 infra/traefik dizini deployment için gereklidir.${NC}"
        exit 1
    fi
    
    cd infra/traefik

    # acme.json dosyası kontrolü
    if [ ! -f "letsencrypt/acme.json" ]; then
        echo -e "${YELLOW}📝 Let's Encrypt acme.json dosyası oluşturuluyor...${NC}"
        touch letsencrypt/acme.json
        chmod 600 letsencrypt/acme.json
        echo -e "${GREEN}✅ acme.json oluşturuldu${NC}"
    fi

    # Traefik'i başlat
    echo -e "${YELLOW}🚀 Traefik başlatılıyor...${NC}"
    docker-compose down 2>/dev/null || true
    docker-compose up -d

    # Traefik'in hazır olmasını bekle
    echo -e "${YELLOW}⏳ Traefik'in hazır olması bekleniyor...${NC}"
    sleep 3
    
    if docker ps --format '{{.Names}}' | grep -q "^traefik$"; then
        echo -e "${GREEN}✅ Traefik hazır${NC}"
    else
        echo -e "${RED}❌ Traefik başlatılamadı${NC}"
        docker-compose logs traefik
        exit 1
    fi
    
    cd ../..
else
    echo -e "${BLUE}⏭️  Traefik kontrolü atlandı (zaten çalışıyor)${NC}"
fi

# ============================================================
# 4. BACKEND & FRONTEND BUILD
# ============================================================
if [ "$SKIP_NPM_BUILD" = "false" ] && [ "$MODE" != "infra" ]; then
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}📦 BACKEND & FRONTEND BUILD${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    # Backend npm install ve build
    echo -e "${YELLOW}📦 Backend dependencies yükleniyor...${NC}"
    cd backend
    if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ]; then
        echo "npm install çalıştırılıyor..."
        npm install
    else
        echo "node_modules mevcut, eksik paketler kontrol ediliyor..."
        # Eksik paketleri kontrol et (swagger-ui-express örneği)
        if [ ! -d "node_modules/swagger-ui-express" ]; then
            echo "⚠️  Bazı paketler eksik, npm install çalıştırılıyor..."
            npm install
        else
            echo "✅ Tüm paketler mevcut"
        fi
    fi
    echo -e "${YELLOW}🔨 Backend build ediliyor...${NC}"
    npm run build
    echo -e "${GREEN}✅ Backend hazır${NC}"
    cd ..

    # Frontend npm install ve build
    echo -e "${YELLOW}📦 Frontend dependencies yükleniyor...${NC}"
    cd frontend
    if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ]; then
        echo "npm install çalıştırılıyor..."
        npm install
    else
        echo "node_modules mevcut"
    fi
    echo -e "${YELLOW}🔨 Frontend build ediliyor...${NC}"
    npm run build
    echo -e "${GREEN}✅ Frontend hazır${NC}"
    cd ..
else
    echo -e "${BLUE}⏭️  Backend/Frontend npm build atlandı${NC}"
fi

# ============================================================
# 5. BACKEND .ENV KONTROLÜ
# ============================================================
if [ "$MODE" = "full" ]; then
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}⚙️  BACKEND CONFIGURATION${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
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
    
    # DB_SYNC kontrolü - Mevcut değeri koru, sadece yoksa veya fresh-db modunda ayarla
    if [ "$FRESH_DB" = "true" ]; then
        echo -e "${YELLOW}🔄 Fresh DB modu: DB_SYNC=true ayarlanıyor (ilk kurulum için)${NC}"
        if grep -q "DB_SYNC=" .env; then
            sed -i.bak 's/^DB_SYNC=.*/DB_SYNC=true/' .env
        else
            echo "DB_SYNC=true" >> .env
        fi
    else
        # Mevcut DB_SYNC değerini kontrol et
        if grep -q "DB_SYNC=" .env; then
            CURRENT_DB_SYNC=$(grep "^DB_SYNC=" .env | cut -d'=' -f2)
            if [ "$CURRENT_DB_SYNC" = "true" ]; then
                echo -e "${GREEN}💾 DB_SYNC=true mevcut, korunuyor (entity'ler otomatik güncellenecek)${NC}"
            else
                echo -e "${GREEN}💾 DB_SYNC=false mevcut, korunuyor (migration'lar kullanılacak)${NC}"
            fi
        else
            # DB_SYNC değişkeni yoksa, varsayılan olarak false ekle
            echo -e "${YELLOW}⚠️  DB_SYNC değişkeni bulunamadı, DB_SYNC=false ekleniyor${NC}"
            echo "DB_SYNC=false" >> .env
        fi
    fi
    
    cd ..
fi

# ============================================================
# 6. DOCKER NETWORK KONTROLÜ
# ============================================================
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}🔗 DOCKER NETWORKS${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# global_databases_network kontrolü
if ! docker network ls | grep -q "global_databases_network"; then
    echo -e "${YELLOW}⚠️  global_databases_network bulunamadı! Database stack'i çalıştırılıyor...${NC}"
    cd docker-datatabse-stack
    docker-compose up -d
    sleep 5
    cd ..
fi

if docker network ls | grep -q "global_databases_network"; then
    echo -e "${GREEN}✅ global_databases_network mevcut${NC}"
else
    echo -e "${RED}❌ global_databases_network oluşturulamadı!${NC}"
    exit 1
fi

# ============================================================
# 7. APPLICATION STACK (Backend + Frontend)
# ============================================================
if [ "$MODE" = "build" ] || [ "$MODE" = "infra" ] || [ "$MODE" = "full" ]; then
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}🚀 APPLICATION STACK (Backend + Frontend)${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    cd infra

    # Environment variables ayarla
    export NODE_ENV=production
    export DB_HOST=global_postgres
    export DB_PORT=${DB_PORT:-5432}
    export DB_USERNAME=${DB_USERNAME:-dev_user}
    export DB_PASSWORD=${DB_PASSWORD:-dev_pass}
    export DB_NAME=${DB_NAME:-tour_saas}

    if [ "$MODE" = "build" ] || [ "$MODE" = "infra" ]; then
        # Sadece build modunda - container'ları durdurma, sadece rebuild
        echo -e "${YELLOW}🔨 Container'lar rebuild ediliyor...${NC}"
        docker-compose up -d --build
    else
        # Full modunda - container'ları durdur ve yeniden başlat
        echo -e "${YELLOW}🔄 Application stack yeniden başlatılıyor...${NC}"
        
        # Eski container'ları temizle (orphaned container'lar dahil)
        echo -e "${YELLOW}🧹 Eski container'lar temizleniyor...${NC}"
        docker-compose down --remove-orphans 2>/dev/null || true
        
        # Tüm eski container'ları zorla kaldır (project prefix ile başlayanlar dahil)
        echo -e "${YELLOW}🔍 Eski container'lar aranıyor...${NC}"
        ALL_CONTAINERS=$(docker ps -a --format "{{.Names}}" || true)
        
        if echo "$ALL_CONTAINERS" | grep -q "saas-tour-backend"; then
            BACKEND_CONTAINERS=$(echo "$ALL_CONTAINERS" | grep "saas-tour-backend")
            echo -e "${YELLOW}🗑️  Backend container'ları kaldırılıyor...${NC}"
            echo "$BACKEND_CONTAINERS" | while read container; do
                echo "   - $container"
                docker rm -f "$container" 2>/dev/null || true
            done
        fi
        
        if echo "$ALL_CONTAINERS" | grep -q "saas-tour-frontend"; then
            FRONTEND_CONTAINERS=$(echo "$ALL_CONTAINERS" | grep "saas-tour-frontend")
            echo -e "${YELLOW}🗑️  Frontend container'ları kaldırılıyor...${NC}"
            echo "$FRONTEND_CONTAINERS" | while read container; do
                echo "   - $container"
                docker rm -f "$container" 2>/dev/null || true
            done
        fi
        
        if echo "$ALL_CONTAINERS" | grep -q "saas-tour-worker"; then
            WORKER_CONTAINERS=$(echo "$ALL_CONTAINERS" | grep "saas-tour-worker")
            echo -e "${YELLOW}🗑️  Worker container'ları kaldırılıyor...${NC}"
            echo "$WORKER_CONTAINERS" | while read container; do
                echo "   - $container"
                docker rm -f "$container" 2>/dev/null || true
            done
        fi
        
        # Kısa bir bekleme (container'ların tamamen kaldırılması için)
        sleep 2
        
        docker-compose up -d --build
    fi

    # Backend'in başlamasını bekle
    echo -e "${YELLOW}⏳ Backend'in başlaması bekleniyor...${NC}"
    sleep 8
    
    # Backend'in çalıştığını kontrol et
    if docker ps --format '{{.Names}}' | grep -q "^saas-tour-backend$"; then
        echo -e "${GREEN}✅ Backend container çalışıyor${NC}"
    else
        echo -e "${RED}❌ Backend container başlatılamadı${NC}"
        docker-compose logs backend | tail -50
        exit 1
    fi
    
    # Migration durumunu kontrol et (backend loglarından)
    echo -e "${YELLOW}📊 Migration durumu kontrol ediliyor...${NC}"
    sleep 3
    if docker logs saas-tour-backend 2>&1 | grep -q "migration"; then
        MIGRATION_LOG=$(docker logs saas-tour-backend 2>&1 | grep -i "migration" | tail -5)
        echo -e "${CYAN}Migration logları:${NC}"
        echo "$MIGRATION_LOG"
    fi
    
    # Worker'ın çalıştığını kontrol et
    echo -e "${YELLOW}📧 Email Worker kontrolü...${NC}"
    if docker ps --format '{{.Names}}' | grep -q "^saas-tour-worker$"; then
        echo -e "${GREEN}✅ Worker container çalışıyor${NC}"
    else
        echo -e "${YELLOW}⚠️  Worker container başlatılıyor...${NC}"
        docker-compose up -d worker 2>/dev/null || echo -e "${YELLOW}⚠️  Worker service docker-compose.yml'de bulunamadı${NC}"
    fi
    
    cd ..
else
    echo -e "${RED}❌ Geçersiz mod: $MODE${NC}"
    exit 1
fi

# ============================================================
# 8. DEPLOYMENT ÖZETİ
# ============================================================
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ DEPLOYMENT TAMAMLANDI!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${BLUE}📊 Container Durumu:${NC}"
cd infra
docker-compose ps

echo ""
echo -e "${BLUE}🌐 Erişim Bilgileri:${NC}"
echo -e "   Multi-Tenant Subdomain (Traefik):"
echo -e "   • ${GREEN}http://sunset.local.saastour360.test:5001${NC} (local)"
echo -e "   • ${GREEN}http://berg.local.saastour360.test:5001${NC} (local)"
echo -e "   • ${GREEN}https://sunset.saastour360.com${NC} (production - Traefik 443'te)"
echo -e "   • ${GREEN}https://berg.saastour360.com${NC} (production - Traefik 443'te)"
echo ""
echo -e "   Direkt Erişim (Mevcut sistemle uyumlu):"
echo -e "   • Frontend: ${GREEN}http://localhost:9001${NC}"
echo -e "   • Backend API: ${GREEN}http://localhost:4001/api${NC}"
echo ""
echo -e "   Traefik Dashboard:"
echo -e "   • ${GREEN}http://localhost:8080${NC}"
echo ""

echo -e "${BLUE}📝 Yararlı Komutlar:${NC}"
echo "   # Logları görüntüle:"
echo "   docker-compose logs -f backend"
echo "   docker-compose logs -f frontend"
echo "   docker-compose logs -f worker"
echo ""
echo "   # Migration durumu:"
echo "   docker logs saas-tour-backend | grep -i migration"
echo ""
echo "   # Container'ları durdur:"
echo "   docker-compose down"
echo ""
echo "   # Database seed çalıştır:"
echo "   ./deploy.sh seed"
echo ""

if [ "$FRESH_DB" = "true" ]; then
    echo -e "${YELLOW}⚠️  NOT: Fresh DB modu kullanıldı. Database sıfırdan kuruldu.${NC}"
    echo -e "${YELLOW}   DB_SYNC=true ayarlandı. İlk kurulumdan sonra backend/.env dosyasında DB_SYNC=false yapın.${NC}"
    echo ""
fi

cd ..
