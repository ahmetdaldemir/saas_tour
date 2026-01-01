#!/bin/bash

# Hızlı Deployment Script
# Bu script projeyi build edip sunucuda Docker ile çalıştırır

set -e

echo "🚀 Hızlı Deployment Başlatılıyor..."

# Sunucu bilgileri environment variable'lardan okunur
# Kullanım: export REMOTE_HOST="your-server" export REMOTE_USER="user" export REMOTE_PATH="/path"
REMOTE_HOST="${REMOTE_HOST:-}"
REMOTE_USER="${REMOTE_USER:-root}"
REMOTE_PATH="${REMOTE_PATH:-/var/www/html/saastour360}"

if [ -z "$REMOTE_HOST" ]; then
    echo "❌ Hata: REMOTE_HOST environment variable'ı ayarlanmamış!"
    echo "Kullanım: export REMOTE_HOST=\"your-server-ip\" ./quick-deploy.sh"
    exit 1
fi

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

