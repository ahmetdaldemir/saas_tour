# Production Domain Kurulumu - berg.saastour360.com

Bu doküman, `berg.saastour360.com` domain'inin production'da çalışması için yapılması gereken adımları içerir.

## 📋 Ön Gereksinimler

1. Domain sahibi olmak (`saastour.com`)
2. DNS yönetim paneline erişim
3. Sunucu erişimi (185.209.228.189)
4. Docker ve Docker Compose kurulu olmalı

---

## 🔧 1. DNS Ayarları

DNS sağlayıcınızın (GoDaddy, Namecheap, Cloudflare vb.) kontrol paneline giriş yapın ve şu kayıtları ekleyin:

### Wildcard A Record (Tüm subdomain'ler için)
```
Type: A
Name: *
Value: 185.209.228.189
TTL: 3600 (veya varsayılan)
```

**VEYA** her tenant için ayrı ayrı:

```
Type: A
Name: berg
Value: 185.209.228.189
TTL: 3600

Type: A
Name: sunset
Value: 185.209.228.189
TTL: 3600
```

### Not:
- Wildcard kayıt (`*`) tüm subdomain'leri kapsar (`berg.saastour360.com`, `sunset.saastour360.com` vb.)
- DNS değişikliklerinin yayılması 15 dakika - 24 saat sürebilir
- Kontrol etmek için: `nslookup berg.saastour360.com` veya `dig berg.saastour360.com`
- DNS değişikliklerinin yayılması 15 dakika - 24 saat sürebilir
- Kontrol etmek için: `nslookup berg.saastour.com` veya `dig berg.saastour.com`

---

## 🌐 2. Traefik Port Ayarları

Production'da Traefik'in **80 ve 443** portlarını direkt kullanması gerekir. 

⚠️ **ÖNEMLİ**: Local'de `5001:80` ve `5443:443` kullanılıyor, production'da bunları `80:80` ve `443:443` yapmalısınız.

### `infra/traefik/docker-compose.yml` dosyasını güncelleyin:

**Production için:**
```yaml
ports:
  - "80:80"      # HTTP - Production için
  - "443:443"    # HTTPS - Production için
  - "8080:8080"  # Dashboard (opsiyonel)
```

**Local development için (şu anki hali):**
```yaml
ports:
  - "5001:80"    # HTTP - Local için
  - "5443:443"   # HTTPS - Local için
  - "8080:8080"  # Dashboard
```

⚠️ **DİKKAT**: Port 80 ve 443 kullanımı için sunucuda başka bir servis bu portları kullanmamalı (Apache, Nginx vb.)

### Port kontrolü:
```bash
# Sunucuda çalışan servisleri kontrol edin
sudo netstat -tulpn | grep -E ':(80|443)'
# veya
sudo ss -tulpn | grep -E ':(80|443)'
```

---

## 🔒 3. Let's Encrypt Email Ayarları

`infra/traefik/docker-compose.yml` dosyasında Let's Encrypt email adresi zaten doğru yapılandırılmış:

```yaml
- "--certificatesresolvers.le.acme.email=admin@saastour360.com"
```

⚠️ **Not**: Gerekirse email adresini güncelleyebilirsiniz.

---

## 📝 4. Docker Compose Yapılandırması

`infra/docker-compose.yml` dosyasındaki Traefik label'ları **zaten doğru yapılandırılmış**! 

Mevcut yapılandırma `saastour360.com` domain'ini destekliyor:

### Backend Labels (Mevcut - Doğru):
```yaml
# HTTP Router (local + production)
- "traefik.http.routers.backend-http.rule=(HostRegexp(`[a-z0-9-]+\\.saastour360\\.com`) || HostRegexp(`[a-z0-9-]+\\.local\\.saastour360\\.test`)) && PathPrefix(`/api`)"

# HTTPS Router (production only)
- "traefik.http.routers.backend-https.rule=HostRegexp(`[a-z0-9-]+\\.saastour360\\.com`) && PathPrefix(`/api`)"
```

### Frontend Labels (Mevcut - Doğru):
```yaml
# HTTP Router (local + production)
- "traefik.http.routers.frontend-http.rule=HostRegexp(`[a-z0-9-]+\\.saastour360\\.com`) || HostRegexp(`[a-z0-9-]+\\.local\\.saastour360\\.test`)"

# HTTPS Router (production only)
- "traefik.http.routers.frontend-https.rule=HostRegexp(`[a-z0-9-]+\\.saastour360\\.com`)"
```

✅ **Hiçbir değişiklik gerekmez!** Yapılandırma zaten hazır.

---

## 🗄️ 5. Database'de Tenant Kontrolü

Database'de `berg` slug'ına sahip bir tenant olmalı. Kontrol edin:

```sql
SELECT * FROM tenants WHERE slug = 'berg';
```

Eğer yoksa, oluşturun:

```sql
INSERT INTO tenants (id, name, slug, category, "isActive", default_language, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'Berg',
  'berg',
  'rentacar',  -- veya 'tour'
  TRUE,
  'tr',  -- veya 'en'
  NOW(),
  NOW()
);
```

---

## 🚀 6. Deployment Adımları

### Sunucuda:

1. **Dosyaları güncelleyin:**
```bash
cd /var/www/html/saastour360
git pull  # veya dosyaları manuel olarak güncelleyin
```

2. **Traefik'i yeniden başlatın:**
```bash
cd infra/traefik
docker-compose down
docker-compose up -d
```

3. **Application stack'i yeniden başlatın:**
```bash
cd ../..
cd infra
docker-compose down
docker-compose up -d --build
```

4. **Logları kontrol edin:**
```bash
# Traefik logları
docker logs traefik -f

# Backend logları
docker logs saas-tour-backend -f

# Frontend logları
docker logs saas-tour-frontend -f
```

---

## ✅ 7. Test ve Doğrulama

### DNS Kontrolü:
```bash
nslookup berg.saastour360.com
# veya
dig berg.saastour360.com
```

### HTTP Test:
```bash
curl -I http://berg.saastour360.com
# 301 veya 302 redirect beklenir (HTTPS'e yönlendirme)
```

### HTTPS Test:
```bash
curl -I https://berg.saastour360.com
# 200 OK beklenir
```

### API Test:
```bash
curl https://berg.saastour360.com/api/health
# {"status":"ok"} gibi bir response beklenir
```

### Browser Test:
1. `https://berg.saastour360.com` adresini açın
2. SSL sertifikasının geçerli olduğunu kontrol edin (yeşil kilit ikonu)
3. Frontend'in yüklendiğini kontrol edin
4. API isteklerinin çalıştığını kontrol edin (browser console'da)

---

## 🔍 8. Sorun Giderme

### SSL Sertifikası Alınamıyor:

1. **Port 80 ve 443'in açık olduğundan emin olun:**
```bash
netstat -tulpn | grep -E ':(80|443)'
```

2. **Traefik loglarını kontrol edin:**
```bash
docker logs traefik | grep -i acme
docker logs traefik | grep -i certificate
```

3. **Firewall kurallarını kontrol edin:**
```bash
# UFW kullanıyorsanız
ufw status
ufw allow 80/tcp
ufw allow 443/tcp

# veya iptables
iptables -L -n | grep -E ':(80|443)'
```

### Domain Çözümlenmiyor:

1. **DNS kayıtlarını kontrol edin:**
```bash
dig berg.saastour360.com
dig *.saastour360.com
```

2. **DNS cache'i temizleyin:**
```bash
# Linux
sudo systemd-resolve --flush-caches

# Mac
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
```

### 404 Not Found Hatası:

1. **Tenant'ın database'de olduğundan emin olun**
2. **Traefik routing loglarını kontrol edin:**
```bash
docker logs traefik | grep berg
```

3. **Backend middleware loglarını kontrol edin:**
```bash
docker logs saas-tour-backend | grep tenant
```

---

## 📊 9. Monitoring

### Traefik Dashboard:
- URL: `http://sunucu-ip:8080` (production'da auth ekleyin!)
- Veya: `http://traefik.local.saastour360.test:5001` (local test için)

### Log Monitoring:
```bash
# Tüm container logları
docker-compose -f infra/docker-compose.yml logs -f

# Sadece Traefik
docker logs traefik -f --tail 100
```

---

## 🔐 10. Production Güvenlik Önerileri

1. **Traefik Dashboard'a Authentication Ekleyin:**
```yaml
# infra/traefik/docker-compose.yml
- "--api.dashboard=true"
- "--api.middlewares=dashboard-auth"
- "--api.middlewares.dashboard-auth.basicauth.users=admin:$$apr1$$..."
```

2. **Rate Limiting Ekleyin:**
```yaml
- "--entrypoints.web.http.middlewares=ratelimit"
- "--middlewares.ratelimit.ratelimit.average=100"
- "--middlewares.ratelimit.ratelimit.burst=50"
```

3. **HTTPS Redirect Zorunlu:**
```yaml
- "--entrypoints.web.http.redirections.entrypoint.to=websecure"
- "--entrypoints.web.http.redirections.entrypoint.scheme=https"
```

---

## 📝 Özet Checklist

- [ ] DNS wildcard A record eklendi (`*.saastour360.com` → `185.209.228.189`)
- [ ] Traefik portları production için 80/443 olarak ayarlandı (sunucuda)
- [ ] Docker Compose label'ları zaten doğru (`saastour360.com` destekleniyor)
- [ ] Let's Encrypt email doğru (`admin@saastour360.com`)
- [ ] Database'de `berg` tenant'ı var
- [ ] Traefik yeniden başlatıldı
- [ ] Application stack yeniden başlatıldı
- [ ] DNS yayılması tamamlandı (15 dk - 24 saat)
- [ ] HTTPS test edildi
- [ ] API test edildi
- [ ] Frontend test edildi

---

## 🎯 Hızlı Başlangıç (Özet)

1. **DNS**: `*.saastour360.com` → `185.209.228.189` (wildcard A record)
2. **Sunucuda Traefik portları**: `infra/traefik/docker-compose.yml` dosyasında portları `80:80` ve `443:443` yap (production için)
3. **Database**: `berg` tenant'ı kontrol et/oluştur
4. **Deploy**: Sunucuda `./deploy.sh full` çalıştır
5. **Test**: `https://berg.saastour360.com`

⚠️ **Not**: Local development için portlar `5001:80` ve `5443:443` olarak kalabilir. Sadece production sunucusunda `80:80` ve `443:443` kullanın.

---

## 📞 Destek

Sorun yaşarsanız logları kontrol edin ve gerekirse GitHub Issues'da bildirin.

