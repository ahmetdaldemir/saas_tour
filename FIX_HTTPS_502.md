# HTTPS 502 Bad Gateway Sorunu - Çözüm

## Sorun

`https://berg.saastour360.com/` adresine erişildiğinde 502 Bad Gateway hatası alınıyor.

## Tespit Edilen Sorunlar

1. **Port Çakışması**: Traefik port 5443'te çalışıyor ama Cloudflare port 443'ten trafik gönderiyor
2. **Production Port Ayarları**: Local development için 5443:443 kullanılıyor, production'da 443:443 olmalı
3. **Certificate Resolver Hatası**: Let's Encrypt certificate resolver çalışmıyor (acme.json permissions)

## Çözüm

### 1. Traefik Port Ayarlarını Güncelleme

Production'da Traefik'in port 80 ve 443'ü direkt kullanması gerekiyor:

```yaml
ports:
  - "80:80"      # HTTP - Production
  - "443:443"    # HTTPS - Production
  - "8080:8080"  # Dashboard
```

**⚠️ DİKKAT**: Port 80 ve 443 kullanımı için sunucuda başka bir servis (nginx, apache) bu portları kullanmamalı.

### 2. Let's Encrypt Certificate Resolver Düzeltme

acme.json dosyasının permissions'ını düzelt:

```bash
cd /var/www/html/saastour360/infra/traefik
chmod 600 letsencrypt/acme.json
```

### 3. Traefik'i Yeniden Başlatma

```bash
cd /var/www/html/saastour360/infra/traefik
docker-compose down
docker-compose up -d
```

## Kontrol Komutları

### Port Kullanımını Kontrol Et

```bash
# Port 443'te ne çalışıyor?
lsof -i :443
netstat -tulpn | grep :443

# Port 80'de ne çalışıyor?
lsof -i :80
netstat -tulpn | grep :80
```

### HTTPS Erişimini Test Et

```bash
curl -I https://berg.saastour360.com/
```

## Notlar

- **Local Development**: Port 5001 (HTTP) ve 5443 (HTTPS) kullanılabilir
- **Production**: Port 80 (HTTP) ve 443 (HTTPS) kullanılmalı
- **Cloudflare**: Eğer Cloudflare kullanıyorsanız, SSL/TLS ayarını "Full" veya "Full (strict)" yapın
- **Certificate Resolver**: Let's Encrypt otomatik SSL sertifikası sağlar

## Alternatif Çözüm: Cloudflare Flexible SSL

Eğer Traefik'i port 443'e taşıyamazsanız, Cloudflare'de SSL/TLS ayarını "Flexible" yapabilirsiniz (güvenlik açısından önerilmez).

