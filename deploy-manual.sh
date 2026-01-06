#!/bin/bash

# SaaS Tour - Manuel Sunucu Deployment (sshpass olmadan)
# Git Bash üzerinde çalışır

# Renkli output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}🚀 SaaS Tour - Manuel Sunucu Deployment${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Sunucu bilgileri
REMOTE_HOST="185.209.228.189"
REMOTE_USER="root"
REMOTE_PATH="/var/www/html/saastour360"

echo -e "${YELLOW}📋 Bu script şu adımları gerçekleştirecek:${NC}"
echo "   1. backend/dist klasörünü sunucuya yükle"
echo "   2. frontend/dist klasörünü sunucuya yükle"
echo "   3. Infra klasörünü sunucuya yükle"
echo "   4. deploy.sh'ı sunucuya yükle"
echo "   5. Sunucuda deployment başlat"
echo ""
echo -e "${YELLOW}⚠️  NOT: Her adımda SSH şifresi istenecek (güvenlik)${NC}"
echo ""
read -p "Devam etmek istiyor musunuz? (y/n): " confirm

if [ "$confirm" != "y" ]; then
    echo -e "${RED}❌ İşlem iptal edildi${NC}"
    exit 0
fi

echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}📤 DOSYALAR SUNUCUYA YÜKLENIYOR${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 1. Backend dist
echo -e "${YELLOW}1/7 Backend dist yükleniyor...${NC}"
scp -r backend/dist ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/backend/ || {
    echo -e "${RED}❌ Backend dist yüklenemedi${NC}"
    exit 1
}
echo -e "${GREEN}✅ Backend dist yüklendi${NC}"
echo ""

# 2. Backend config dosyaları
echo -e "${YELLOW}2/7 Backend config dosyaları yükleniyor...${NC}"
scp backend/package.json backend/Dockerfile ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/backend/ || {
    echo -e "${RED}❌ Backend config yüklenemedi${NC}"
    exit 1
}
echo -e "${GREEN}✅ Backend config yüklendi${NC}"
echo ""

# 3. Frontend dist
echo -e "${YELLOW}3/7 Frontend dist yükleniyor...${NC}"
scp -r frontend/dist ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/frontend/ || {
    echo -e "${RED}❌ Frontend dist yüklenemedi${NC}"
    exit 1
}
echo -e "${GREEN}✅ Frontend dist yüklendi${NC}"
echo ""

# 4. Frontend nginx
echo -e "${YELLOW}4/7 Frontend nginx config yükleniyor...${NC}"
scp -r frontend/nginx ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/frontend/ || {
    echo -e "${RED}❌ Frontend nginx yüklenemedi${NC}"
    exit 1
}
echo -e "${GREEN}✅ Frontend nginx yüklendi${NC}"
echo ""

# 5. Frontend config dosyaları
echo -e "${YELLOW}5/7 Frontend config dosyaları yükleniyor...${NC}"
scp frontend/package.json frontend/Dockerfile ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/frontend/ || {
    echo -e "${RED}❌ Frontend config yüklenemedi${NC}"
    exit 1
}
echo -e "${GREEN}✅ Frontend config yüklendi${NC}"
echo ""

# 6. Infra klasörü
echo -e "${YELLOW}6/7 Infra klasörü yükleniyor...${NC}"
scp -r infra ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/ || {
    echo -e "${RED}❌ Infra yüklenemedi${NC}"
    exit 1
}
echo -e "${GREEN}✅ Infra yüklendi${NC}"
echo ""

# 7. Deploy script
echo -e "${YELLOW}7/7 Deploy script yükleniyor...${NC}"
scp deploy.sh ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/ || {
    echo -e "${RED}❌ Deploy script yüklenemedi${NC}"
    exit 1
}
echo -e "${GREEN}✅ Deploy script yüklendi${NC}"
echo ""

echo -e "${GREEN}✅ Tüm dosyalar başarıyla yüklendi${NC}"
echo ""

# Sunucuda deployment başlat
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}🚀 SUNUCUDA DEPLOYMENT BAŞLATILIYOR${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

ssh ${REMOTE_USER}@${REMOTE_HOST} << 'ENDSSH'
    set -e
    
    # Renkli output
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    RED='\033[0;31m'
    BLUE='\033[0;34m'
    CYAN='\033[0;36m'
    NC='\033[0m'
    
    REMOTE_PATH="/var/www/html/saastour360"
    
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}🚀 SUNUCU DEPLOYMENT BAŞLATILIYOR${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    echo -e "${BLUE}📍 Sunucu: $(hostname)${NC}"
    echo -e "${BLUE}📁 Deployment Path: ${REMOTE_PATH}${NC}"
    echo -e "${BLUE}⏰ Zaman: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
    echo ""
    
    # Dizine git
    cd ${REMOTE_PATH} || { echo -e "${RED}❌ Error: Cannot change to directory${NC}"; exit 1; }
    
    # Production temizliği
    echo -e "${YELLOW}🧹 Production Temizliği Başlatılıyor...${NC}"
    
    # Silinecek klasörler
    FOLDERS_TO_DELETE=(
        "frontend/src"
        "backend/src"
        "frontend1"
        "mobile"
        "postman"
        "scripts"
        ".git"
        ".github"
        ".vscode"
    )
    
    for folder in "${FOLDERS_TO_DELETE[@]}"; do
        if [ -d "$folder" ]; then
            echo -e "   ${YELLOW}🗑️  Siliniyor: $folder${NC}"
            rm -rf "$folder"
        fi
    done
    
    # .md dosyalarını sil
    find . -maxdepth 2 -type f \( -name "*.md" -o -name "*.MD" \) -not -path "./node_modules/*" 2>/dev/null | while read file; do
        if [ -f "$file" ]; then
            rm -f "$file"
        fi
    done
    
    # .sql dosyalarını sil
    find . -maxdepth 3 -type f -name "*.sql" -not -path "./node_modules/*" 2>/dev/null | while read file; do
        if [ -f "$file" ]; then
            rm -f "$file"
        fi
    done
    
    # .env.example, tsconfig, .ps1 dosyalarını sil
    find . -maxdepth 2 -type f \( -name ".env.example" -o -name "env.example" -o -name "tsconfig*.json" -o -name "*.ps1" -o -name ".gitignore" -o -name ".eslintrc*" -o -name ".prettierrc*" -o -name "vite.config.*" \) 2>/dev/null | while read file; do
        if [ -f "$file" ]; then
            rm -f "$file"
        fi
    done
    
    echo -e "${GREEN}✅ Production temizliği tamamlandı${NC}"
    echo ""
    
    # Güvenlik kontrolü
    echo -e "${YELLOW}🔒 Güvenlik Kontrolü:${NC}"
    SECURITY_ISSUES=0
    
    if [ -d "backend/src" ]; then
        echo -e "   ${RED}⚠️  UYARI: backend/src kaynak kodları hala sunucuda!${NC}"
        SECURITY_ISSUES=$((SECURITY_ISSUES + 1))
    fi
    
    if [ -d "frontend/src" ]; then
        echo -e "   ${RED}⚠️  UYARI: frontend/src kaynak kodları hala sunucuda!${NC}"
        SECURITY_ISSUES=$((SECURITY_ISSUES + 1))
    fi
    
    if [ -d ".git" ]; then
        echo -e "   ${RED}⚠️  UYARI: .git deposu sunucuda!${NC}"
        SECURITY_ISSUES=$((SECURITY_ISSUES + 1))
    fi
    
    if [ $SECURITY_ISSUES -eq 0 ]; then
        echo -e "   ${GREEN}✅ Güvenlik kontrolü başarılı${NC}"
    else
        echo -e "   ${YELLOW}⚠️  $SECURITY_ISSUES adet güvenlik uyarısı bulundu${NC}"
    fi
    echo ""
    
    # Deployment başlat
    echo -e "${YELLOW}🔨 Container deployment başlatılıyor...${NC}"
    echo ""
    
    chmod +x deploy.sh
    ./deploy.sh infra
    
    # Container'ları restart et
    echo ""
    echo -e "${YELLOW}🔄 Container'lar yeniden başlatılıyor...${NC}"
    cd infra
    
    # Backend restart
    echo -e "   • Backend restart ediliyor..."
    docker-compose restart backend
    sleep 3
    
    # Frontend restart
    echo -e "   • Frontend restart ediliyor..."
    docker-compose restart frontend
    sleep 3
    
    # Worker restart (varsa)
    if docker ps -a --format '{{.Names}}' | grep -q "^saas-tour-worker$"; then
        echo -e "   • Worker restart ediliyor..."
        docker-compose restart worker
        sleep 2
    fi
    
    echo -e "${GREEN}✅ Container'lar yeniden başlatıldı${NC}"
    echo ""
    
    # Container'ların hazır olmasını bekle
    echo -e "${YELLOW}⏳ Container'ların hazır olması bekleniyor (15 saniye)...${NC}"
    sleep 15
    
    # Restart sonrası backend logları
    echo -e "${BLUE}📄 Backend Restart Sonrası Loglar:${NC}"
    docker logs saas-tour-backend --tail 20 2>&1 | while read line; do
        echo "   $line"
    done
    echo ""
    
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}✅ SUNUCU DEPLOYMENT DURUMU${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    # Container durumları
    echo -e "${BLUE}📦 Container Durumları:${NC}"
    cd infra
    docker-compose ps
    echo ""
    
    # Backend health check
    echo -e "${BLUE}🏥 Backend Health Check:${NC}"
    if docker ps --format '{{.Names}}' | grep -q "^saas-tour-backend$"; then
        echo -e "   ${GREEN}✅ Backend container çalışıyor${NC}"
        
        # Backend loglarının son 10 satırı
        echo -e "${BLUE}📄 Backend Son Loglar:${NC}"
        docker logs saas-tour-backend --tail 10 2>&1 | while read line; do
            echo "      $line"
        done
    else
        echo -e "   ${RED}❌ Backend container çalışmıyor!${NC}"
    fi
    echo ""
    
    # Frontend health check
    echo -e "${BLUE}🌐 Frontend Health Check:${NC}"
    if docker ps --format '{{.Names}}' | grep -q "^saas-tour-frontend$"; then
        echo -e "   ${GREEN}✅ Frontend container çalışıyor${NC}"
    else
        echo -e "   ${RED}❌ Frontend container çalışmıyor!${NC}"
    fi
    echo ""
    
    # Database health check
    echo -e "${BLUE}🗄️  Database Health Check:${NC}"
    if docker ps --format '{{.Names}}' | grep -q "^global_postgres$"; then
        echo -e "   ${GREEN}✅ PostgreSQL container çalışıyor${NC}"
    else
        echo -e "   ${RED}❌ PostgreSQL container çalışmıyor!${NC}"
    fi
    echo ""
    
    # Disk kullanımı
    echo -e "${BLUE}💾 Disk Kullanımı:${NC}"
    df -h ${REMOTE_PATH} | tail -1 | awk '{print "   Kullanılan: "$3" / Toplam: "$2" ("$5" dolu)"}'
    echo ""
    
    cd ..
    
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ SUNUCU DEPLOYMENT TAMAMLANDI!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${BLUE}🌐 Erişim URL'leri:${NC}"
    echo -e "   • Frontend: ${GREEN}https://saastour360.com${NC}"
    echo -e "   • Backend API: ${GREEN}https://saastour360.com/api${NC}"
    echo -e "   • Traefik Dashboard: ${GREEN}http://$(hostname -I | awk '{print $1}'):8080${NC}"
ENDSSH

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

