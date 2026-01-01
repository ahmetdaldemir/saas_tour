# GitHub Actions Deployment Setup

Bu proje GitHub Actions ile otomatik deployment yapılandırması içermektedir.

## Kurulum Adımları

### 1. GitHub Secrets Ekleme

⚠️ **ÖNEMLİ**: Deployment'ın çalışması için aşağıdaki secrets'ların **TAMAMININ** eklenmiş olması gerekmektedir!

GitHub repository'nizde aşağıdaki secrets'ları eklemeniz gerekmektedir:

**Settings > Secrets and variables > Actions > New repository secret**

Aşağıdaki secrets'ları ekleyin:

| Secret Adı | Örnek Değer | Açıklama | Zorunlu |
|------------|-------------|----------|---------|
| `SFTP_HOST` | `your-server-ip` | Sunucu IP adresi veya domain | ✅ Evet |
| `SFTP_USERNAME` | `deploy` | SSH/SFTP kullanıcı adı | ✅ Evet |
| `SFTP_PASSWORD` | `your-secure-password` | SSH/SFTP şifresi | ✅ Evet |
| `SFTP_PORT` | `22` | SSH port | ❌ Hayır (varsayılan: 22) |
| `SFTP_REMOTE_PATH` | `/var/www/html/saastour360` | Sunucudaki deployment dizini | ✅ Evet |

**Not:** Eğer `SSHPASS` veya hostname boş hatası alıyorsanız, secrets'ların doğru eklendiğinden emin olun!

### 2. Secrets Ekleme Komutu (GitHub CLI)

Eğer GitHub CLI kullanıyorsanız:

```bash
gh secret set SFTP_HOST --body "your-server-ip"
gh secret set SFTP_USERNAME --body "your-username"
gh secret set SFTP_PASSWORD --body "your-secure-password"
gh secret set SFTP_PORT --body "22"
gh secret set SFTP_REMOTE_PATH --body "/var/www/html/saastour360"
```

### 3. Workflow Tetikleme

Deployment otomatik olarak şu durumlarda tetiklenir:

- ✅ `main` branch'ine direkt push yapıldığında
- ✅ `main` branch'ine pull request **merge edildiğinde** (sadece kapatıldığında değil)
- ✅ GitHub Actions UI'dan manuel olarak `workflow_dispatch` ile

**Önemli Notlar:**
- ❌ `develop` branch'ine push yapmak deployment'ı **TETİKLEMEZ**
- ✅ Sadece `main` branch'ine merge edildiğinde deployment otomatik çalışır
- ✅ Production'a deploy için `develop` → `main` merge workflow'u kullanın

**Repository:** https://github.com/ahmetdaldemir/saas_tour.git

### 4. Deployment Süreci

1. **Checkout**: Kod repository'den çekilir
2. **Node.js Setup**: Node.js 20 kurulur
3. **Dependencies**: Frontend ve backend dependencies yüklenir
4. **Build**: Frontend ve backend build edilir
5. **RSync Deploy**: Dosyalar sunucuya RSync ile yüklenir (hızlı ve güvenilir, sadece değişen dosyalar gönderilir)
6. **SSH Deploy**: Sunucuda `./deploy.sh infra` komutu çalıştırılır

### 5. Excluded Files

Aşağıdaki dosyalar/klasörler deployment'a dahil edilmez:

- `.git/`
- `node_modules/`
- `.vscode/`
- `.github/`
- `.env` dosyaları
- Log dosyaları
- `.DS_Store`
- `dist/` klasörleri (build edilmiş dosyalar)

### 6. Sunucu Gereksinimleri

Sunucuda aşağıdakilerin hazır olması gerekmektedir:

- Docker ve Docker Compose kurulu
- `deploy.sh` script'inin executable olması (`chmod +x deploy.sh`)
- Gerekli network'lerin oluşturulmuş olması (global_databases_network)
- Database stack'inin kurulu olması

### 7. Troubleshooting

**Deployment başarısız olursa:**

1. GitHub Actions loglarını kontrol edin
2. Sunucuda `deploy.sh infra` komutunu manuel çalıştırın
3. SSH bağlantısını test edin:
   ```bash
   ssh your-username@your-server-ip
   ```

**SFTP bağlantı sorunları:**

- Firewall ayarlarını kontrol edin
- SSH port'unun açık olduğundan emin olun
- Credentials'ların doğru olduğunu kontrol edin

## Güvenlik Notu

⚠️ **ÖNEMLİ**: Secrets'larda hassas bilgiler (şifreler, API key'ler) saklanmaktadır. Bu bilgileri asla repository'ye commit etmeyin!

