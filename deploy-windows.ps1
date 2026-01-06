# Multi-Tenant SaaS Platform - Windows PowerShell Deployment Script
# Windows üzerinde sunucuya deployment yapar

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('production', 'development', 'local')]
    [string]$Mode = 'production'
)

# Renkli output fonksiyonları
function Write-Success { param($Message) Write-Host $Message -ForegroundColor Green }
function Write-Warning { param($Message) Write-Host $Message -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host $Message -ForegroundColor Red }
function Write-Info { param($Message) Write-Host $Message -ForegroundColor Cyan }

# Banner
Write-Info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Info "🚀 SaaS Tour Platform - Windows Deployment"
Write-Info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host ""

# Sunucu bilgileri
$SFTP_HOST = "185.209.228.189"
$SFTP_USERNAME = "root"
$SFTP_PASSWORD = "@198711Ad@"
$SFTP_PORT = "22"
$SFTP_REMOTE_PATH = "/var/www/html/saastour360"

if ($Mode -eq "development" -or $Mode -eq "local") {
    Write-Info "🔧 Development modu: Sadece lokal deployment yapılacak"
    Write-Warning "Sunucuya deploy edilmeyecek. Production deploy için: .\deploy-windows.ps1 production"
    
    # Sadece local deploy için bash script çağır
    Write-Info "Local deployment başlatılıyor..."
    bash deploy.sh local
    exit 0
}

Write-Info "🚀 Production modu: Lokal build + Sunucuya deploy"
Write-Host ""

# Lokal deployment başlat
Write-Info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Info "📦 LOKAL BUILD BAŞLATILIYOR"
Write-Info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host ""

# Bash script ile local deployment
bash deploy.sh development

Write-Host ""
Write-Info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Info "🌐 SUNUCUYA DEPLOYMENT"
Write-Info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host ""

# plink ve pscp kontrolü (PuTTY)
$plinkExists = Get-Command plink -ErrorAction SilentlyContinue
$pscpExists = Get-Command pscp -ErrorAction SilentlyContinue

if (-not $plinkExists -or -not $pscpExists) {
    Write-Warning "⚠️  PuTTY araçları (plink/pscp) bulunamadı!"
    Write-Host ""
    Write-Info "📥 PuTTY İndirme Seçenekleri:"
    Write-Host "   1. Chocolatey ile: " -NoNewline
    Write-Success "choco install putty"
    Write-Host "   2. Manuel indirme: " -NoNewline
    Write-Success "https://www.putty.org/"
    Write-Host "   3. Scoop ile: " -NoNewline
    Write-Success "scoop install putty"
    Write-Host ""
    Write-Warning "PuTTY yüklendikten sonra bu scripti tekrar çalıştırın."
    Write-Host ""
    
    # Alternatif: Manuel yöntem
    Write-Info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    Write-Warning "📋 MANUEL DEPLOYMENT YÖNTEMİ:"
    Write-Info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    Write-Host ""
    Write-Host "1. WinSCP veya FileZilla ile sunucuya bağlanın:"
    Write-Host "   Host: " -NoNewline; Write-Success $SFTP_HOST
    Write-Host "   Username: " -NoNewline; Write-Success $SFTP_USERNAME
    Write-Host "   Port: " -NoNewline; Write-Success $SFTP_PORT
    Write-Host ""
    Write-Host "2. Bu dosya/klasörleri yükleyin:"
    Write-Success "   • backend/dist/"
    Write-Success "   • backend/package.json"
    Write-Success "   • backend/Dockerfile"
    Write-Success "   • frontend/dist/"
    Write-Success "   • frontend/package.json"
    Write-Success "   • frontend/Dockerfile"
    Write-Success "   • frontend/nginx/"
    Write-Success "   • infra/"
    Write-Success "   • deploy.sh"
    Write-Host ""
    Write-Host "3. SSH ile sunucuya bağlanın ve şunu çalıştırın:"
    Write-Success "   cd $SFTP_REMOTE_PATH && chmod +x deploy.sh && ./deploy.sh infra"
    Write-Host ""
    
    exit 1
}

Write-Success "✅ PuTTY araçları bulundu"
Write-Host ""

# Geçici batch dosyası oluştur (plink için otomatik password)
$tempBatch = [System.IO.Path]::GetTempFileName() + ".bat"
$tempScript = [System.IO.Path]::GetTempFileName() + ".sh"

# Dosyaları yükleme başlat
Write-Info "📤 Dosyalar sunucuya yükleniyor..."
Write-Warning "Bu işlem birkaç dakika sürebilir..."
Write-Host ""

# Backend dist
Write-Host "   • Backend dist yükleniyor..." -NoNewline
echo y | pscp -r -P $SFTP_PORT -pw $SFTP_PASSWORD backend/dist ${SFTP_USERNAME}@${SFTP_HOST}:${SFTP_REMOTE_PATH}/backend/ 2>$null
if ($LASTEXITCODE -eq 0) { Write-Success " ✓" } else { Write-Warning " ⚠" }

# Backend package.json ve Dockerfile
Write-Host "   • Backend config dosyaları..." -NoNewline
echo y | pscp -P $SFTP_PORT -pw $SFTP_PASSWORD backend/package.json backend/Dockerfile ${SFTP_USERNAME}@${SFTP_HOST}:${SFTP_REMOTE_PATH}/backend/ 2>$null
if ($LASTEXITCODE -eq 0) { Write-Success " ✓" } else { Write-Warning " ⚠" }

# Frontend dist
Write-Host "   • Frontend dist yükleniyor..." -NoNewline
echo y | pscp -r -P $SFTP_PORT -pw $SFTP_PASSWORD frontend/dist ${SFTP_USERNAME}@${SFTP_HOST}:${SFTP_REMOTE_PATH}/frontend/ 2>$null
if ($LASTEXITCODE -eq 0) { Write-Success " ✓" } else { Write-Warning " ⚠" }

# Frontend nginx
Write-Host "   • Frontend nginx config..." -NoNewline
echo y | pscp -r -P $SFTP_PORT -pw $SFTP_PASSWORD frontend/nginx ${SFTP_USERNAME}@${SFTP_HOST}:${SFTP_REMOTE_PATH}/frontend/ 2>$null
if ($LASTEXITCODE -eq 0) { Write-Success " ✓" } else { Write-Warning " ⚠" }

# Frontend package.json ve Dockerfile
Write-Host "   • Frontend config dosyaları..." -NoNewline
echo y | pscp -P $SFTP_PORT -pw $SFTP_PASSWORD frontend/package.json frontend/Dockerfile ${SFTP_USERNAME}@${SFTP_HOST}:${SFTP_REMOTE_PATH}/frontend/ 2>$null
if ($LASTEXITCODE -eq 0) { Write-Success " ✓" } else { Write-Warning " ⚠" }

# Infra klasörü
Write-Host "   • Infra config yükleniyor..." -NoNewline
echo y | pscp -r -P $SFTP_PORT -pw $SFTP_PASSWORD infra ${SFTP_USERNAME}@${SFTP_HOST}:${SFTP_REMOTE_PATH}/ 2>$null
if ($LASTEXITCODE -eq 0) { Write-Success " ✓" } else { Write-Warning " ⚠" }

# Deploy script
Write-Host "   • Deploy script yükleniyor..." -NoNewline
echo y | pscp -P $SFTP_PORT -pw $SFTP_PASSWORD deploy.sh ${SFTP_USERNAME}@${SFTP_HOST}:${SFTP_REMOTE_PATH}/ 2>$null
if ($LASTEXITCODE -eq 0) { Write-Success " ✓" } else { Write-Warning " ⚠" }

Write-Host ""
Write-Success "✅ Dosyalar başarıyla yüklendi"
Write-Host ""

# Sunucuda deployment başlat
Write-Info "🚀 Sunucuda deployment başlatılıyor..."
Write-Host ""

# SSH komutlarını dosyaya yaz
@"
cd $SFTP_REMOTE_PATH
chmod +x deploy.sh
./deploy.sh infra
"@ | Out-File -FilePath $tempScript -Encoding ASCII

# plink ile SSH bağlantısı
echo y | plink -ssh -P $SFTP_PORT -pw $SFTP_PASSWORD -m $tempScript ${SFTP_USERNAME}@${SFTP_HOST}

Write-Host ""
Write-Success "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Success "🎉 DEPLOYMENT TAMAMLANDI!"
Write-Success "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host ""
Write-Info "🌐 Production URL'leri:"
Write-Success "   • https://saastour360.com"
Write-Success "   • https://sunset.saastour360.com"
Write-Success "   • https://berg.saastour360.com"
Write-Host ""

# Geçici dosyaları temizle
if (Test-Path $tempBatch) { Remove-Item $tempBatch -Force }
if (Test-Path $tempScript) { Remove-Item $tempScript -Force }

