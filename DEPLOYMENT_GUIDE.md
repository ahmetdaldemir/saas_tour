# 🚀 SaaS Tour - Production Deployment Rehberi

## 📋 Deployment Seçenekleri

### ✅ Seçenek 1: Manuel Deployment Script (Önerilen)

**Git Bash'te çalıştırın:**

```bash
./deploy-manual.sh
```

Bu script:
- ✅ Her dosya grubunu sırayla yükler
- ✅ Her adımda şifre sorar (güvenlik)
- ✅ Sunucuda otomatik deployment başlatır
- ✅ Detaylı progress gösterir

---

### 🔧 Seçenek 2: Adım Adım Manuel Deployment

**Git Bash'te sırayla çalıştırın:**

#### 1. Backend Dosyalarını Yükle
```bash
scp -r backend/dist root@185.209.228.189:/var/www/html/saastour360/backend/
scp backend/package.json backend/Dockerfile root@185.209.228.189:/var/www/html/saastour360/backend/
```

#### 2. Frontend Dosyalarını Yükle
```bash
scp -r frontend/dist root@185.209.228.189:/var/www/html/saastour360/frontend/
scp -r frontend/nginx root@185.209.228.189:/var/www/html/saastour360/frontend/
scp frontend/package.json frontend/Dockerfile root@185.209.228.189:/var/www/html/saastour360/frontend/
```

#### 3. Infra ve Deploy Script'i Yükle
```bash
scp -r infra root@185.209.228.189:/var/www/html/saastour360/
scp deploy.sh root@185.209.228.189:/var/www/html/saastour360/
```

#### 4. Sunucuda Deployment Başlat
```bash
ssh root@185.209.228.189
cd /var/www/html/saastour360
chmod +x deploy.sh
./deploy.sh infra
```

---

### 💻 Seçenek 3: PowerShell ile Deployment (PuTTY gerekli)

#### PuTTY Kurulumu

**Chocolatey ile (Yönetici PowerShell):**
```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
choco install putty -y
```

**Manuel İndirme:**
https://www.putty.org/

#### Deployment
```powershell
.\deploy-windows.ps1 production
```

---

### 📦 Seçenek 4: WinSCP ile Manuel Yükleme

1. **WinSCP'yi indirin:** https://winscp.net/
2. **Bağlantı bilgileri:**
   - Host: `185.209.228.189`
   - Username: `root`
   - Password: `@198711Ad@`
   - Port: `22`

3. **Şu dosya/klasörleri yükleyin:**
   ```
   ✅ backend/dist/          → /var/www/html/saastour360/backend/
   ✅ backend/package.json    → /var/www/html/saastour360/backend/
   ✅ backend/Dockerfile      → /var/www/html/saastour360/backend/
   ✅ frontend/dist/          → /var/www/html/saastour360/frontend/
   ✅ frontend/nginx/         → /var/www/html/saastour360/frontend/
   ✅ frontend/package.json   → /var/www/html/saastour360/frontend/
   ✅ frontend/Dockerfile     → /var/www/html/saastour360/frontend/
   ✅ infra/                  → /var/www/html/saastour360/
   ✅ deploy.sh               → /var/www/html/saastour360/
   ```

4. **PuTTY ile SSH bağlantısı açın ve çalıştırın:**
   ```bash
   cd /var/www/html/saastour360
   chmod +x deploy.sh
   ./deploy.sh infra
   ```

---

## 🎯 Deployment Sonrası Kontroller

Deployment tamamlandıktan sonra bu URL'leri kontrol edin:

```
✅ https://saastour360.com
✅ https://sunset.saastour360.com
✅ https://berg.saastour360.com
```

### Health Check
```bash
curl https://saastour360.com/api/health
```

### Container Durumu
```bash
ssh root@185.209.228.189
cd /var/www/html/saastour360/infra
docker-compose ps
```

### Logları Görüntüle
```bash
docker logs saas-tour-backend -f
docker logs saas-tour-frontend -f
```

---

## 🐛 Sorun Giderme

### 1. "Permission denied" Hatası
```bash
chmod +x deploy.sh
```

### 2. "No such file or directory" Hatası
```bash
# Dosyaların doğru yere yüklendiğinden emin olun
ssh root@185.209.228.189
ls -la /var/www/html/saastour360/
```

### 3. Container Başlamıyor
```bash
# Logları kontrol edin
docker logs saas-tour-backend
docker logs saas-tour-frontend

# Container'ları yeniden başlatın
cd /var/www/html/saastour360/infra
docker-compose down
docker-compose up -d
```

### 4. Port Conflict
```bash
# Çakışan container'ları kontrol edin
docker ps -a | grep saas-tour

# Eski container'ları temizleyin
docker stop $(docker ps -aq --filter "name=saas-tour")
docker rm $(docker ps -aq --filter "name=saas-tour")
```

---

## 📞 Destek

Sorun yaşarsanız:
1. Logları kontrol edin: `docker logs saas-tour-backend`
2. Container durumunu kontrol edin: `docker ps`
3. Disk alanını kontrol edin: `df -h`

