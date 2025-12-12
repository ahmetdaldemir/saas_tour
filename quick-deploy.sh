#!/bin/bash

# Hızlı Deployment Script
# Bu script projeyi build edip sunucuda Docker ile çalıştırır

set -e

echo "🚀 Hızlı Deployment Başlatılıyor..."

REMOTE_HOST="185.209.228.189"
REMOTE_USER="root"
REMOTE_PATH="/var/www/html/saastour360"

# 1. Local'de build (opsiyonel - Docker sunucuda build edebilir)
read -p "Local'de build etmek istiyor musunuz? (y/n): " build_local
if [ "$build_local" = "y" ]; then
    echo "📦 Frontend build ediliyor..."
    cd frontend
    npm run build
    cd ..
    
    echo "📦 Backend build ediliyor..."
    cd backend
    npm run build
    cd ..
fi

# 2. Projeyi sunucuya yükle (SFTP kullanarak veya rsync)
echo "📤 Sunucuya yükleniyor..."
read -p "SFTP ile yüklemek için VS Code SFTP extension kullanın. Devam etmek için Enter'a basın..."

# 3. Sunucuda Docker ile çalıştır
echo "🐳 Sunucuda Docker ile çalıştırılıyor..."
ssh ${REMOTE_USER}@${REMOTE_HOST} << ENDSSH
    cd ${REMOTE_PATH}
    
    # Backend .env kontrolü
    if [ ! -f backend/.env ]; then
        echo "⚠️  backend/.env dosyası bulunamadı! Lütfen oluşturun."
        echo "Örnek: cp backend/.env.example backend/.env"
        exit 1
    fi
    
    # Docker Compose ile çalıştır
    cd infra
    docker-compose down
    docker-compose up -d --build
    
    echo "✅ Deployment tamamlandı!"
    echo "📊 Container durumu:"
    docker-compose ps
    
    echo ""
    echo "📝 Logları görmek için:"
    echo "cd ${REMOTE_PATH}/infra && docker-compose logs -f"
ENDSSH

echo "🎉 Deployment tamamlandı!"
echo ""
echo "🌐 Frontend: http://${REMOTE_HOST}:8001"
echo "🔌 Backend API: http://${REMOTE_HOST}:3000/api"

