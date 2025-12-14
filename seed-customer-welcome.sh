#!/bin/bash
# Customer Welcome Email Template Seed Script
# Kullanım: ./seed-customer-welcome.sh

echo "📧 Customer Welcome Email Template oluşturuluyor..."

cd backend
npm run build 2>/dev/null || echo "Build zaten yapılmış"
docker exec saas-tour-backend node dist/scripts/seed-customer-welcome-template.js

echo "✅ Tamamlandı!"
