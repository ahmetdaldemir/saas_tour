#!/bin/bash

# Multi-Tenant SaaS Platform - Comprehensive Deployment Script
# Database verilerini koruyarak tüm mimariyi yeni baştan çalıştırır
#
# Kullanım:
#   ./deploy.sh              - Tam deployment (veriler korunur) + Otomatik sunucuya deploy (production modu)
#   ./deploy.sh production   - Tam deployment + Otomatik sunucuya deploy
#   ./deploy.sh development  - Sadece lokal deployment (sunucuya deploy etmez)
#   ./deploy.sh local        - Sadece lokal deployment (sunucuya deploy etmez) - development ile aynı
#   ./deploy.sh --fresh-db   - Database'i sıfırdan kurar (DİKKAT: Tüm veriler silinir!)
#   ./deploy.sh build        - Sadece Docker build (container'lar çalışıyorsa)
#   ./deploy.sh infra        - Sadece infra stack'ini build et (sunucuda kullanılır)
#   ./deploy.sh full         - Tam deployment (npm install dahil)
#   ./deploy.sh seed         - Database seed çalıştır (Docker container içinden)
#   ./deploy.sh seed:global  - Global destinations/hotels seed çalıştır
#
# Otomatik Sunucuya Deploy:
#   - production modu: Lokal işlemler tamamlandıktan sonra sunucuya otomatik deploy eder
#   - development/local modu: Sadece lokal deployment yapar, sunucuya deploy etmez
#   - Sunucu bilgileri: SFTP_HOST, SFTP_USERNAME, SFTP_PASSWORD env variable'ları ile override edilebilir

set -e

# Renkli output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Sunucu deployment ayarları (environment variable'dan okunur, default yok)
# ⚠️  ÖNEMLİ: Production deployment için bu değişkenleri ayarlayın:
#   export SFTP_HOST="your-server-ip"
#   export SFTP_USERNAME="your-username"
#   export SFTP_PASSWORD="your-password"
#   export SFTP_PORT="22"
#   export SFTP_REMOTE_PATH="/var/www/html/saastour360"
SFTP_HOST="185.209.228.189"
SFTP_USERNAME="root"
SFTP_PASSWORD="@198711Ad@"
SFTP_PORT="22"
SFTP_REMOTE_PATH="/var/www/html/saastour360"
 
# Komut satırı argümanları
MODE=${1:-production}
FRESH_DB=false
DEPLOY_TO_SERVER=true

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

# Mod kontrolü (development/local: sadece lokal, production: lokal + sunucuya deploy)
if [ "$MODE" = "development" ] || [ "$MODE" = "local" ]; then
    DEPLOY_TO_SERVER=false
    MODE="full"
    echo -e "${BLUE}🔧 Development modu: Sadece lokal deployment yapılacak, sunucuya deploy edilmeyecek${NC}"
elif [ "$MODE" = "production" ]; then
    DEPLOY_TO_SERVER=true
    MODE="full"
    echo -e "${GREEN}🚀 Production modu: Lokal deployment + Sunucuya deploy yapılacak${NC}"
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

# Agresif container temizleme fonksiyonu
force_remove_backend_container() {
    local container_name="saas-tour-backend"
    local max_attempts=15
    local attempt=0
    local current_dir=$(pwd)
    
    echo -e "${YELLOW}🔍 Agresif container temizleme başlatılıyor: $container_name${NC}"
    
    # Eğer infra dizinindeysek, docker-compose komutlarını orada çalıştır
    if [ -f "docker-compose.yml" ]; then
        local compose_dir="."
    elif [ -d "infra" ] && [ -f "infra/docker-compose.yml" ]; then
        local compose_dir="infra"
    else
        local compose_dir="."
    fi
    
    while [ $attempt -lt $max_attempts ]; do
        attempt=$((attempt + 1))
        
        # 1. Docker Compose down
        if [ -n "$compose_dir" ] && [ "$compose_dir" != "." ]; then
            cd "$compose_dir" && docker-compose down --remove-orphans 2>/dev/null || true
            cd "$current_dir"
        else
            docker-compose down --remove-orphans 2>/dev/null || true
        fi
        
        # 2. Tüm container'ları ID ile bul
        ALL_IDS=$(docker ps -a --format "{{.ID}}" 2>/dev/null || true)
        if [ -n "$ALL_IDS" ]; then
            echo "$ALL_IDS" | while IFS= read -r id; do
                if [ -n "$id" ]; then
                    # Container ismini kontrol et
                    name=$(docker inspect --format='{{.Name}}' "$id" 2>/dev/null | sed 's/\///g' || echo "")
                    if echo "$name" | grep -qi "$container_name"; then
                        echo "   - Deneme $attempt: Container bulundu ve kaldırılıyor: $id ($name)"
                        docker stop "$id" 2>/dev/null || true
                        docker rm -f "$id" 2>/dev/null || true
                    fi
                fi
            done
        fi
        
        # 3. Filter ile kaldır
        docker ps -a --filter "name=$container_name" --format "{{.ID}}" 2>/dev/null | while IFS= read -r id; do
            if [ -n "$id" ]; then
                echo "   - Deneme $attempt: Filter ile kaldırılıyor: $id"
                docker stop "$id" 2>/dev/null || true
                docker rm -f "$id" 2>/dev/null || true
            fi
        done || true
        
        # 4. İsim bazlı kaldır
        docker stop "$container_name" 2>/dev/null || true
        docker rm -f "$container_name" 2>/dev/null || true
        
        # 5. Tüm container'ları tarayarak bul
        docker ps -a --format "{{.ID}} {{.Names}}" 2>/dev/null | grep -i "$container_name" | while IFS= read -r line; do
            if [ -n "$line" ]; then
                container_id=$(echo "$line" | awk '{print $1}')
                echo "   - Deneme $attempt: Tarama ile kaldırılıyor: $container_id"
                docker stop "$container_id" 2>/dev/null || true
                docker rm -f "$container_id" 2>/dev/null || true
            fi
        done || true
        
        # 6. Container'ın kaldırıldığını kontrol et
        REMAINING=$(docker ps -a --filter "name=$container_name" --format "{{.ID}}" | head -1 || true)
        if [ -z "$REMAINING" ]; then
            echo -e "${GREEN}✅ Container başarıyla kaldırıldı (Deneme: $attempt)${NC}"
            return 0
        else
            echo "   - Deneme $attempt/$max_attempts: Container hala mevcut: $REMAINING"
            sleep 1
        fi
    done
    
    # Son deneme: Zorla kaldır
    FINAL_ID=$(docker ps -a --filter "name=$container_name" --format "{{.ID}}" | head -1 || true)
    if [ -n "$FINAL_ID" ]; then
        echo -e "${RED}⚠️  Son deneme: Container zorla kaldırılıyor: $FINAL_ID${NC}"
        docker stop "$FINAL_ID" 2>/dev/null || true
        docker rm -f "$FINAL_ID" 2>/dev/null || true
        docker stop "$container_name" 2>/dev/null || true
        docker rm -f "$container_name" 2>/dev/null || true
        sleep 3
    fi
    
    # Final kontrol
    FINAL_CHECK=$(docker ps -a --filter "name=$container_name" --format "{{.ID}}" | head -1 || true)
    if [ -z "$FINAL_CHECK" ]; then
        echo -e "${GREEN}✅ Container kesinlikle kaldırıldı${NC}"
        return 0
    else
        echo -e "${RED}❌ UYARI: Container hala mevcut olabilir: $FINAL_CHECK${NC}"
        echo -e "${YELLOW}💡 Manuel olarak kaldırmayı deneyin: docker rm -f $FINAL_CHECK${NC}"
        return 1
    fi
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
    
    if [ ! -d "infra/traefik" ]; then
        echo -e "${RED}❌ Hata: infra/traefik dizini bulunamadı! Mevcut dizin: $(pwd)${NC}"
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
        # Eksik paketleri kontrol et (swagger-ui-express ve node-cron örneği)
        if [ ! -d "node_modules/swagger-ui-express" ] || [ ! -d "node_modules/node-cron" ]; then
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
    
    # DB_SYNC kontrolü - Otomatik olarak true yap (veriler korunur, sadece schema güncellenir)
    if [ "$FRESH_DB" = "true" ]; then
        echo -e "${YELLOW}🔄 Fresh DB modu: DB_SYNC=true ayarlanıyor (ilk kurulum için)${NC}"
        if grep -q "DB_SYNC=" .env; then
            sed -i.bak 's/^DB_SYNC=.*/DB_SYNC=true/' .env
        else
            echo "DB_SYNC=true" >> .env
        fi
    else
        # Normal deploy: DB_SYNC=true yap (TypeORM synchronize verileri silmez, sadece schema günceller)
        echo -e "${GREEN}🔄 DB_SYNC=true ayarlanıyor (entity'ler otomatik güncellenecek, veriler korunacak)${NC}"
        if grep -q "DB_SYNC=" .env; then
            sed -i.bak 's/^DB_SYNC=.*/DB_SYNC=true/' .env
        else
            echo "DB_SYNC=true" >> .env
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
    if [ ! -d "infra" ]; then
        echo -e "${RED}❌ Hata: infra dizini bulunamadı! Mevcut dizin: $(pwd)${NC}"
        exit 1
    fi
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
        # Zero-downtime deployment: Yeni container'ları build et, sonra graceful restart
        echo -e "${YELLOW}🔨 Container'lar rebuild ediliyor (zero-downtime)...${NC}"
        
        # Önce TÜM çakışan container'ları agresif şekilde temizle
        echo -e "${YELLOW}🧹 Çakışan container'lar temizleniyor...${NC}"
        docker-compose down --remove-orphans 2>/dev/null || true
        
        # ÖNEMLİ: Tüm saas-tour-backend container'larını önce isim bazlı temizle
        echo -e "${YELLOW}🔍 saas-tour-backend container'ları temizleniyor (isim bazlı)...${NC}"
        BACKEND_CONTAINERS=$(docker ps -a --filter "name=saas-tour-backend" --format "{{.ID}} {{.Names}}" || true)
        if [ -n "$BACKEND_CONTAINERS" ]; then
            echo "$BACKEND_CONTAINERS" | while IFS= read -r line; do
                if [ -n "$line" ]; then
                    container_id=$(echo "$line" | awk '{print $1}')
                    container_name=$(echo "$line" | awk '{print $2}')
                    echo "   - Removing backend: $container_name ($container_id)"
                    docker stop "$container_id" 2>/dev/null || true
                    docker rm -f "$container_id" 2>/dev/null || true
                fi
            done
        fi
        
        # Tüm saas-tour container'larını ID bazlı temizle (isim fark etmeksizin)
        echo -e "${YELLOW}🔍 Tüm saas-tour container'ları temizleniyor (ID bazlı)...${NC}"
        # Tüm saas-tour container ID'lerini al ve temizle
        docker ps -a --format "{{.ID}} {{.Names}}" | grep -iE "saas-tour" | while IFS= read -r line; do
            if [ -n "$line" ]; then
                container_id=$(echo "$line" | awk '{print $1}')
                container_name=$(echo "$line" | awk '{print $2}')
                echo "   - Removing: $container_name ($container_id)"
                docker stop "$container_id" 2>/dev/null || true
                docker rm -f "$container_id" 2>/dev/null || true
            fi
        done || true
        
        # Hash prefix'li container'ları temizle (örn: 0706ee066bd58acb00b1ca4e1e9b1738d0cbb01aa5dfe3a774d830edf98cc5ef)
        echo -e "${YELLOW}🔍 Hash prefix'li container'lar temizleniyor...${NC}"
        # Önce hash prefix'li container'ları ID bazlı bul ve temizle
        docker ps -a --format "{{.ID}} {{.Names}}" | grep -E "^[a-f0-9]{12,}" | while IFS= read -r line; do
            if [ -n "$line" ]; then
                container_id=$(echo "$line" | awk '{print $1}')
                container_name=$(echo "$line" | awk '{print $2}')
                if echo "$container_name" | grep -qiE "saas-tour|infra"; then
                    echo "   - Removing hash-prefixed by ID: $container_name ($container_id)"
                    docker stop "$container_id" 2>/dev/null || true
                    docker rm -f "$container_id" 2>/dev/null || true
                fi
            fi
        done || true
        
        # Hash prefix'li container'ları isim bazlı da temizle
        docker ps -a --format "{{.Names}}" | grep -E "^[a-f0-9]{8,}_" | grep -E "saas-tour|infra" | while IFS= read -r container; do
            if [ -n "$container" ]; then
                echo "   - Removing hash-prefixed by name: $container"
                docker stop "$container" 2>/dev/null || true
                docker rm -f "$container" 2>/dev/null || true
            fi
        done || true
        
        # Tüm infra ile ilgili container'ları temizle (sadece saas-tour olanlar)
        echo -e "${YELLOW}🔍 Infra container'ları temizleniyor...${NC}"
        docker ps -a --format "{{.ID}} {{.Names}}" | grep -iE "infra" | grep -v "traefik" | while IFS= read -r line; do
            if [ -n "$line" ]; then
                container_id=$(echo "$line" | awk '{print $1}')
                container_name=$(echo "$line" | awk '{print $2}')
                # Sadece saas-tour ile ilgili olanları temizle
                if echo "$container_name" | grep -qiE "saas-tour"; then
                    echo "   - Removing infra: $container_name ($container_id)"
                    docker stop "$container_id" 2>/dev/null || true
                    docker rm -f "$container_id" 2>/dev/null || true
                fi
            fi
        done || true
        
        # Son kontrol: Hala kalan saas-tour-backend container'ları var mı?
        REMAINING_BACKEND=$(docker ps -a --filter "name=saas-tour-backend" --format "{{.ID}}" || true)
        if [ -n "$REMAINING_BACKEND" ]; then
            echo -e "${YELLOW}⚠️  Hala kalan backend container'ları zorla temizleniyor...${NC}"
            echo "$REMAINING_BACKEND" | while IFS= read -r container_id; do
                if [ -n "$container_id" ]; then
                    echo "   - Force removing backend ID: $container_id"
                    docker stop "$container_id" 2>/dev/null || true
                    docker rm -f "$container_id" 2>/dev/null || true
                fi
            done
        fi
        
        # Container prune
        docker container prune -f 2>/dev/null || true
        
        # Ekstra güvenlik: Tüm saas-tour-backend container'larını ID ile zorla temizle
        echo -e "${YELLOW}🔍 Ekstra güvenlik: Tüm backend container'ları ID ile temizleniyor...${NC}"
        # Önce filter ile dene
        ALL_BACKEND_IDS=$(docker ps -a --filter "name=saas-tour-backend" --format "{{.ID}}" 2>/dev/null || true)
        # Eğer filter çalışmazsa, grep ile bul
        if [ -z "$ALL_BACKEND_IDS" ]; then
            ALL_BACKEND_IDS=$(docker ps -a --format "{{.ID}} {{.Names}}" 2>/dev/null | grep -i "saas-tour-backend" | awk '{print $1}' || true)
        fi
        if [ -n "$ALL_BACKEND_IDS" ]; then
            echo "$ALL_BACKEND_IDS" | while IFS= read -r container_id; do
                if [ -n "$container_id" ] && [ ${#container_id} -ge 12 ]; then
                    echo "   - Force removing backend container ID: ${container_id:0:12}"
                    docker stop "${container_id:0:12}" 2>/dev/null || docker stop "$container_id" 2>/dev/null || true
                    docker rm -f "${container_id:0:12}" 2>/dev/null || docker rm -f "$container_id" 2>/dev/null || true
                fi
            done
        fi
        
        # Tüm container'ları kontrol et ve saas-tour-backend içerenleri temizle
        docker ps -a --format "{{.ID}} {{.Names}}" 2>/dev/null | grep -i "saas-tour-backend" | while IFS= read -r line; do
            if [ -n "$line" ]; then
                container_id=$(echo "$line" | awk '{print $1}')
                container_name=$(echo "$line" | awk '{print $2}')
                echo "   - Removing: $container_name ($container_id)"
                docker stop "$container_id" 2>/dev/null || true
                docker rm -f "$container_id" 2>/dev/null || true
            fi
        done || true
        
        sleep 10
        
        # Son bir kez daha kontrol et ve zorla temizle
        echo -e "${YELLOW}🔍 Son kontrol: saas-tour-backend container'ı zorla temizleniyor...${NC}"
        # Container ID'yi al (eğer varsa)
        EXISTING_BACKEND_ID=$(docker ps -a --filter "name=^saas-tour-backend$" --format "{{.ID}}" | head -1 || true)
        if [ -n "$EXISTING_BACKEND_ID" ]; then
            echo "   - Zorla kaldırılıyor: $EXISTING_BACKEND_ID"
            docker stop "$EXISTING_BACKEND_ID" 2>/dev/null || true
            docker rm -f "$EXISTING_BACKEND_ID" 2>/dev/null || true
        fi
        # İsim bazlı da dene
        docker stop saas-tour-backend 2>/dev/null || true
        docker rm -f saas-tour-backend 2>/dev/null || true
        
        # Biraz bekle (container'ın tamamen kaldırılması için)
        sleep 5
        
        # Önce yeni image'ları build et
        echo -e "${YELLOW}📦 Yeni image'lar build ediliyor...${NC}"
        docker-compose build --no-cache
        
        # Son bir kez daha: docker-compose up'dan önce container'ı zorla kaldır
        echo -e "${YELLOW}🔍 docker-compose up öncesi son kontrol...${NC}"
        docker-compose down --remove-orphans 2>/dev/null || true
        
        # Tüm saas-tour-backend container'larını bul ve kaldır (tam ID ve kısa ID ile)
        ALL_BACKEND_CONTAINERS=$(docker ps -a --format "{{.ID}} {{.Names}}" 2>/dev/null | grep -i "saas-tour-backend" || true)
        if [ -n "$ALL_BACKEND_CONTAINERS" ]; then
            echo "$ALL_BACKEND_CONTAINERS" | while IFS= read -r line; do
                if [ -n "$line" ]; then
                    container_id=$(echo "$line" | awk '{print $1}')
                    container_name=$(echo "$line" | awk '{print $2}')
                    echo "   - Force removing: $container_name (ID: $container_id)"
                    # Tam ID ile dene
                    docker stop "$container_id" 2>/dev/null || true
                    docker rm -f "$container_id" 2>/dev/null || true
                    # Kısa ID ile de dene (ilk 12 karakter)
                    if [ ${#container_id} -ge 12 ]; then
                        short_id="${container_id:0:12}"
                        docker stop "$short_id" 2>/dev/null || true
                        docker rm -f "$short_id" 2>/dev/null || true
                    fi
                fi
            done
        fi
        
        # İsim bazlı da kaldır (tüm varyasyonlar)
        docker stop saas-tour-backend 2>/dev/null || true
        docker rm -f saas-tour-backend 2>/dev/null || true
        
        # Docker Compose'un oluşturduğu container'ı da kaldır
        docker-compose rm -f backend 2>/dev/null || true
        
        # Ekstra güvenlik: Belirli container ID'yi direkt kaldır (eğer hata mesajında görünüyorsa)
        # Bu, hata mesajından alınan container ID'yi direkt kaldırır
        echo -e "${YELLOW}🔍 Belirli conflict container ID'leri temizleniyor...${NC}"
        # Tüm çalışan/durmuş container'ları kontrol et ve saas-tour-backend içerenleri kaldır
        docker ps -a --format "{{.ID}} {{.Names}}" 2>/dev/null | while IFS= read -r line; do
            if echo "$line" | grep -qi "saas-tour-backend"; then
                container_id=$(echo "$line" | awk '{print $1}')
                echo "   - Removing conflict container: $container_id"
                docker stop "$container_id" 2>/dev/null || true
                docker rm -f "$container_id" 2>/dev/null || true
            fi
        done || true
        
        sleep 5
        
        # Graceful restart: Force recreate ile başlat
        echo -e "${YELLOW}🔄 Container'lar graceful restart ile güncelleniyor...${NC}"
        
        # Agresif container temizleme fonksiyonunu çağır (infra dizininde)
        if [ ! -d "infra" ]; then
            echo -e "${RED}❌ Hata: infra dizini bulunamadı! Mevcut dizin: $(pwd)${NC}"
            echo -e "${YELLOW}   Script dizini: $SCRIPT_DIR${NC}"
            exit 1
        fi
        cd infra
        force_remove_backend_container
        sleep 2
        docker-compose up -d --force-recreate --remove-orphans
        cd ..
    else
        # Full modunda - container'ları durdur ve yeniden başlat
        echo -e "${YELLOW}🔄 Application stack yeniden başlatılıyor...${NC}"
        
        # Eski container'ları temizle (orphaned container'lar dahil)
        echo -e "${YELLOW}🧹 Eski container'lar temizleniyor...${NC}"
        
        # Önce docker-compose down ile temizle (volumes korunur)
        docker-compose down --remove-orphans 2>/dev/null || true
        
        # Tüm container'ları durdur ve kaldır (hash prefix'li olanlar dahil)
        echo -e "${YELLOW}🔍 Tüm container'lar temizleniyor (ID bazlı)...${NC}"
        # Tüm çalışan ve durmuş container'ları al (ID ile)
        ALL_CONTAINER_IDS=$(docker ps -a --format "{{.ID}} {{.Names}}" | grep -E "saas-tour|infra_" | awk '{print $1}' || true)
        if [ -n "$ALL_CONTAINER_IDS" ]; then
            while IFS= read -r container_id; do
                if [ -n "$container_id" ]; then
                    echo "   - Container ID: $container_id"
                    docker stop "$container_id" 2>/dev/null || true
                    docker rm -f "$container_id" 2>/dev/null || true
                fi
            done <<< "$ALL_CONTAINER_IDS"
        fi
        
        # Tüm eski container'ları zorla kaldır (isim bazlı)
        echo -e "${YELLOW}🔍 Eski container'lar aranıyor...${NC}"
        ALL_CONTAINERS=$(docker ps -a --format "{{.Names}}" || true)
        
        # Backend container'larını kaldır (tüm varyasyonlar - tam isim ve prefix'li isimler)
        BACKEND_CONTAINERS=$(echo "$ALL_CONTAINERS" | grep -E "(^saas-tour-backend$|.*_saas-tour-backend$|saas-tour-backend)" || true)
        if [ -n "$BACKEND_CONTAINERS" ]; then
            echo -e "${YELLOW}🗑️  Backend container'ları kaldırılıyor...${NC}"
            while IFS= read -r container; do
                if [ -n "$container" ]; then
                    echo "   - $container"
                    docker stop "$container" 2>/dev/null || true
                    docker rm -f "$container" 2>/dev/null || true
                fi
            done <<< "$BACKEND_CONTAINERS"
        fi
        
        # Frontend container'larını kaldır
        FRONTEND_CONTAINERS=$(echo "$ALL_CONTAINERS" | grep -E "(^saas-tour-frontend$|.*_saas-tour-frontend$|saas-tour-frontend)" || true)
        if [ -n "$FRONTEND_CONTAINERS" ]; then
            echo -e "${YELLOW}🗑️  Frontend container'ları kaldırılıyor...${NC}"
            while IFS= read -r container; do
                if [ -n "$container" ]; then
                    echo "   - $container"
                    docker stop "$container" 2>/dev/null || true
                    docker rm -f "$container" 2>/dev/null || true
                fi
            done <<< "$FRONTEND_CONTAINERS"
        fi
        
        # Worker container'larını kaldır
        WORKER_CONTAINERS=$(echo "$ALL_CONTAINERS" | grep -E "(^saas-tour-worker$|.*_saas-tour-worker$|saas-tour-worker)" || true)
        if [ -n "$WORKER_CONTAINERS" ]; then
            echo -e "${YELLOW}🗑️  Worker container'ları kaldırılıyor...${NC}"
            while IFS= read -r container; do
                if [ -n "$container" ]; then
                    echo "   - $container"
                    docker stop "$container" 2>/dev/null || true
                    docker rm -f "$container" 2>/dev/null || true
                fi
            done <<< "$WORKER_CONTAINERS"
        fi
        
        # Docker Compose'un oluşturduğu tüm container'ları kaldır (project prefix ile başlayanlar)
        echo -e "${YELLOW}🔍 Docker Compose project container'ları temizleniyor...${NC}"
        # Docker Compose project name'i al (dizin adından)
        PROJECT_NAME=$(basename "$(pwd)" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]//g')
        # Tüm container'ları kontrol et ve project prefix ile başlayanları kaldır
        COMPOSE_CONTAINERS=$(docker ps -a --format "{{.Names}}" | grep -E "^${PROJECT_NAME}_" || true)
        if [ -n "$COMPOSE_CONTAINERS" ]; then
            while IFS= read -r container; do
                if [ -n "$container" ]; then
                    echo "   - $container"
                    docker stop "$container" 2>/dev/null || true
                    docker rm -f "$container" 2>/dev/null || true
                fi
            done <<< "$COMPOSE_CONTAINERS"
        fi
        
        # Ek güvenlik: Hash prefix'li container'ları da temizle (örn: 30e7575fe239_saas-tour-backend, ca18ed3f0846_saas-tour-backend)
        echo -e "${YELLOW}🔍 Hash prefix'li container'lar temizleniyor...${NC}"
        # Tüm hash prefix'li container'ları bul (herhangi bir hex hash ile başlayan ve saas-tour içeren)
        HASH_PREFIXED=$(docker ps -a --format "{{.Names}}" | grep -E "^[a-f0-9]{8,}_" | grep -E "saas-tour|infra" || true)
        if [ -n "$HASH_PREFIXED" ]; then
            while IFS= read -r container; do
                if [ -n "$container" ]; then
                    echo "   - $container (hash-prefixed)"
                    docker stop "$container" 2>/dev/null || true
                    docker rm -f "$container" 2>/dev/null || true
                fi
            done <<< "$HASH_PREFIXED"
        fi
        
        # Tüm saas-tour ve infra ile ilgili container'ları zorla temizle (isim fark etmeksizin)
        echo -e "${YELLOW}🔍 Tüm saas-tour/infra container'ları zorla temizleniyor...${NC}"
        ALL_REMAINING=$(docker ps -a --format "{{.ID}} {{.Names}}" | grep -iE "saas-tour|infra" || true)
        if [ -n "$ALL_REMAINING" ]; then
            while IFS= read -r line; do
                if [ -n "$line" ]; then
                    container_id=$(echo "$line" | awk '{print $1}')
                    container_name=$(echo "$line" | awk '{print $2}')
                    echo "   - Removing: $container_name ($container_id)"
                    docker stop "$container_id" 2>/dev/null || true
                    docker rm -f "$container_id" 2>/dev/null || true
                fi
            done <<< "$ALL_REMAINING"
        fi
        
        
        # Docker prune (stopped container'ları temizle)
        echo -e "${YELLOW}🧹 Stopped container'lar temizleniyor...${NC}"
        docker container prune -f 2>/dev/null || true
        
        # Son kontrol: Hala kalan container'lar var mı?
        REMAINING_CONTAINERS=$(docker ps -a --format "{{.Names}}" | grep -iE "saas-tour|infra" || true)
        if [ -n "$REMAINING_CONTAINERS" ]; then
            echo -e "${YELLOW}⚠️  Hala kalan container'lar var, zorla temizleniyor...${NC}"
            echo "$REMAINING_CONTAINERS" | while IFS= read -r container; do
                if [ -n "$container" ]; then
                    echo "   - Force removing: $container"
                    docker rm -f "$container" 2>/dev/null || true
                fi
            done
        fi
        
        # Kısa bir bekleme (container'ların tamamen kaldırılması için)
        sleep 5
        
        # Son bir kez daha kontrol et ve zorla temizle
        echo -e "${YELLOW}🔍 Son kontrol: saas-tour-backend container'ı zorla temizleniyor...${NC}"
        # Container ID'yi al (eğer varsa)
        EXISTING_BACKEND_ID=$(docker ps -a --filter "name=^saas-tour-backend$" --format "{{.ID}}" | head -1 || true)
        if [ -n "$EXISTING_BACKEND_ID" ]; then
            echo "   - Zorla kaldırılıyor: $EXISTING_BACKEND_ID"
            docker stop "$EXISTING_BACKEND_ID" 2>/dev/null || true
            docker rm -f "$EXISTING_BACKEND_ID" 2>/dev/null || true
        fi
        # İsim bazlı da dene
        docker stop saas-tour-backend 2>/dev/null || true
        docker rm -f saas-tour-backend 2>/dev/null || true
        
        # Biraz bekle (container'ın tamamen kaldırılması için)
        sleep 5
        
        # Son bir kez daha: docker-compose up'dan önce container'ı zorla kaldır
        echo -e "${YELLOW}🔍 docker-compose up öncesi son kontrol (full mode)...${NC}"
        docker-compose down --remove-orphans 2>/dev/null || true
        
        # Tüm saas-tour-backend container'larını bul ve kaldır (ID ve isim bazlı)
        ALL_CONFLICT_CONTAINERS=$(docker ps -a --format "{{.ID}} {{.Names}}" 2>/dev/null | grep -i "saas-tour-backend" || true)
        if [ -n "$ALL_CONFLICT_CONTAINERS" ]; then
            echo "$ALL_CONFLICT_CONTAINERS" | while IFS= read -r line; do
                if [ -n "$line" ]; then
                    container_id=$(echo "$line" | awk '{print $1}')
                    container_name=$(echo "$line" | awk '{print $2}')
                    echo "   - Force removing conflict container: $container_name ($container_id)"
                    # Tam ID ile
                    docker stop "$container_id" 2>/dev/null || true
                    docker rm -f "$container_id" 2>/dev/null || true
                    # Kısa ID ile (ilk 12 karakter)
                    if [ ${#container_id} -ge 12 ]; then
                        short_id="${container_id:0:12}"
                        docker stop "$short_id" 2>/dev/null || true
                        docker rm -f "$short_id" 2>/dev/null || true
                    fi
                fi
            done
        fi
        
        # İsim bazlı da kaldır (tüm varyasyonlar)
        docker stop saas-tour-backend 2>/dev/null || true
        docker rm -f saas-tour-backend 2>/dev/null || true
        
        # Docker Compose'un oluşturduğu container'ı da kaldır
        docker-compose rm -f backend 2>/dev/null || true
        
        # Ekstra güvenlik: Tüm container'ları tek tek kontrol et
        echo -e "${YELLOW}🔍 Tüm container'lar tek tek kontrol ediliyor...${NC}"
        docker ps -a --format "{{.ID}} {{.Names}}" 2>/dev/null | while IFS= read -r line; do
            if echo "$line" | grep -qi "saas-tour-backend"; then
                container_id=$(echo "$line" | awk '{print $1}')
                container_name=$(echo "$line" | awk '{print $2}')
                echo "   - Removing: $container_name ($container_id)"
                docker stop "$container_id" 2>/dev/null || true
                docker rm -f "$container_id" 2>/dev/null || true
            fi
        done || true
        
        sleep 5
        
        # Force recreate ile container'ları yeniden oluştur
        # Production'da dikkatli: Bu mod tüm container'ları yeniden başlatır
        echo -e "${YELLOW}⚠️  Full deployment modu: Tüm container'lar yeniden oluşturulacak${NC}"
        
        # Agresif container temizleme fonksiyonunu çağır (infra dizininde)
        force_remove_backend_container
        
        sleep 2
        
        docker-compose up -d --build --force-recreate --remove-orphans
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

# ============================================================
# 9. OTOMATIK SUNUCUYA DEPLOY (opsiyonel)
# ============================================================
if [ "$DEPLOY_TO_SERVER" = "true" ] && [ "$MODE" != "seed" ] && [ "$MODE" != "seed:global" ]; then
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}🌐 OTOMATIK SUNUCUYA DEPLOY${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    # Sunucu bilgileri kontrolü
    if [ -z "$SFTP_HOST" ] || [ -z "$SFTP_USERNAME" ] || [ -z "$SFTP_PASSWORD" ]; then
        echo -e "${YELLOW}⚠️  Sunucu deployment bilgileri eksik!${NC}"
        echo -e "${YELLOW}   Environment variable'ları ayarlayın:${NC}"
        echo -e "${YELLOW}   export SFTP_HOST=\"your-server-ip\"${NC}"
        echo -e "${YELLOW}   export SFTP_USERNAME=\"your-username\"${NC}"
        echo -e "${YELLOW}   export SFTP_PASSWORD=\"your-password\"${NC}"
        echo -e "${YELLOW}   export SFTP_PORT=\"22\" (opsiyonel)${NC}"
        echo -e "${YELLOW}   export SFTP_REMOTE_PATH=\"/var/www/html/saastour360\" (opsiyonel)${NC}"
        echo -e "${BLUE}⏭️  Sunucuya deploy atlandı (development modu için: ./deploy.sh development)${NC}"
        exit 0
    fi
    
    # Sunucu bilgileri (yukarıda tanımlı)
    REMOTE_HOST="$SFTP_HOST"
    REMOTE_USER="$SFTP_USERNAME"
    REMOTE_PATH="$SFTP_REMOTE_PATH"
    
    # SSH ve rsync kontrolü
    if ! command -v sshpass &> /dev/null; then
        echo -e "${YELLOW}⚠️  sshpass bulunamadı. Sunucuya deploy için yükleniyor...${NC}"
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            if command -v brew &> /dev/null; then
                brew install hudochenkov/sshpass/sshpass 2>/dev/null || echo -e "${YELLOW}⚠️  Homebrew ile sshpass yüklenemedi. Manuel yükleyin: brew install hudochenkov/sshpass/sshpass${NC}"
            fi
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            # Linux
            sudo apt-get update && sudo apt-get install -y sshpass 2>/dev/null || echo -e "${YELLOW}⚠️  sshpass yüklenemedi${NC}"
        fi
    fi
    
    if command -v sshpass &> /dev/null; then
        echo -e "${YELLOW}📤 Sunucuya dosyalar yükleniyor...${NC}"
        
        # Önce hedef dizinleri oluştur
        echo -e "${YELLOW}📁 Hedef dizinler oluşturuluyor...${NC}"
        sshpass -e ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
            ${REMOTE_USER}@${REMOTE_HOST} << ENDSSH
            mkdir -p ${REMOTE_PATH}/backend/src/modules/auth/controllers
            mkdir -p ${REMOTE_PATH}/backend/src/modules
            mkdir -p ${REMOTE_PATH}/postman
            mkdir -p ${REMOTE_PATH}/backend
            chmod -R 755 ${REMOTE_PATH}/backend 2>/dev/null || true
            chmod -R 755 ${REMOTE_PATH}/postman 2>/dev/null || true
ENDSSH
        
        # RSync ile dosyaları yükle (exclude listesi ile, hata toleransı ile)
        export SSHPASS="$SFTP_PASSWORD"
        sshpass -e rsync -avz --partial --inplace --delete \
            -e "ssh -p 22 -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null" \
            --exclude='.git' \
            --exclude='node_modules' \
            --exclude='.vscode' \
            --exclude='.github' \
            --exclude='.env' \
            --exclude='.env.*' \
            --exclude='*.log' \
            --exclude='.DS_Store' \
            --exclude='frontend/node_modules' \
            --exclude='backend/node_modules' \
            --exclude='frontend/dist' \
            --exclude='backend/dist' \
            --exclude='docker-datatabse-stack' \
            --exclude='mobile' \
            --exclude='backend/public/uploads/*' \
            --exclude='backend/dist/public/uploads/*' \
            --exclude='postman' \
            ./ ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/ 2>&1 | grep -v "failed: No such file or directory" || {
                echo -e "${YELLOW}⚠️  Bazı dosyalar yüklenemedi (normal olabilir)${NC}"
            }
        
        # postman dizinini ayrı olarak yükle (varsa)
        if [ -d "postman" ]; then
            echo -e "${YELLOW}📤 Postman dosyaları yükleniyor...${NC}"
            sshpass -e rsync -avz --partial --inplace \
                -e "ssh -p 22 -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null" \
                postman/ ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/postman/ 2>&1 | grep -v "failed: No such file or directory" || true
        fi
        
        echo -e "${GREEN}✅ Dosyalar sunucuya yüklendi${NC}"
        
        echo -e "${YELLOW}🚀 Sunucuda deployment başlatılıyor...${NC}"
        
        # Sunucuda deployment script'ini çalıştır
        sshpass -e ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
            ${REMOTE_USER}@${REMOTE_HOST} << ENDSSH
            set -e
            echo "📦 Sunucuda deployment başlatılıyor..."
            cd ${REMOTE_PATH} || { echo "❌ Error: Cannot change to directory"; exit 1; }
            chmod +x deploy.sh || true
            ./deploy.sh infra
            echo "✅ Sunucu deployment tamamlandı!"
ENDSSH
        
        echo -e "${GREEN}✅ Sunucu deployment tamamlandı!${NC}"
    else
        echo -e "${YELLOW}⚠️  sshpass bulunamadı. Sunucuya manuel deploy yapın.${NC}"
        echo -e "${YELLOW}   Veya: ./deploy.sh development (sadece lokal deployment)${NC}"
    fi
else
    echo -e "${BLUE}⏭️  Sunucuya deploy atlandı (development/local modu veya seed modu)${NC}"
fi
