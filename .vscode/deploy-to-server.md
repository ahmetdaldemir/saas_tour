
# VS Code SFTP Extension ile Deployment

## Kurulum

1. VS Code'da "SFTP" extension'ını yükleyin (Natizyskunk tarafından)

## Kullanım

### 1. Tüm Projeyi Yükleme

1. VS Code Command Palette'i açın (`Cmd+Shift+P` veya `Ctrl+Shift+P`)
2. "SFTP: Upload Project" yazın ve seçin
3. Tüm proje sunucuya yüklenecek

### 2. Değişen Dosyaları Yükleme

1. Dosyayı kaydedin
2. Sağ tıklayın → "Upload File" veya
3. Command Palette → "SFTP: Upload Active File"

### 3. Otomatik Upload

`sftp.json` dosyasında `uploadOnSave: true` yaparsanız, her kaydetmede otomatik yüklenir.

## Production Deployment Adımları

### Adım 1: Sunucuya Bağlan ve Hazırlık

```bash
ssh root@185.209.228.189
cd /var/www/html/saastour360
```

### Adım 2: Docker ile Deployment (Önerilen)

```bash
# Backend .env dosyasını oluştur
cd backend
cp .env.example .env
nano .env  # Database ve diğer ayarları yap

# Docker Compose ile çalıştır
cd ../infra
docker-compose -f docker-compose.prod.yml up -d --build

# Logları kontrol et
docker-compose -f docker-compose.prod.yml logs -f
```

### Adım 3: Nginx Yapılandırması (Gerekirse)

Eğer nginx-proxy kullanmıyorsanız:

```bash
apt-get install -y nginx
nano /etc/nginx/sites-available/saastour360
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/saastour360 /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

## Güncellemeler

### Kod Güncellediğinizde

1. VS Code SFTP ile dosyaları yükleyin
2. Sunucuda:
```bash
cd /var/www/html/saastour360/infra
docker-compose -f docker-compose.prod.yml restart
# veya yeniden build için:
docker-compose -f docker-compose.prod.yml up -d --build
```

## Sorun Giderme

- Container'lar çalışmıyor: `docker-compose logs` ile kontrol edin
- Database bağlantı hatası: `.env` dosyasını kontrol edin
- Port kullanımda: `netstat -tulpn | grep :8001` ile kontrol edin

