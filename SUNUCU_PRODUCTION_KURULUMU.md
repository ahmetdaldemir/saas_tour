# Sunucuda Production Kurulumu - berg.saastour360.com

Bu doküman, sunucuda `berg.saastour360.com` domain'inin çalışması için yapılması gereken **sadece sunucu tarafı** adımları içerir.

## 🎯 Mevcut Durum

- ✅ Traefik yapılandırması hazır (local'de çalışıyor)
- ✅ Docker Compose label'ları `saastour360.com` için hazır
- ✅ Backend ve Frontend hazır
- ⚠️ Sadece sunucu yapılandırması gerekiyor

---

## 📋 1. DNS Ayarları (Domain Sağlayıcınızda)

DNS sağlayıcınızın kontrol paneline giriş yapın ve şu kaydı ekleyin:

### Wildcard A Record
```
Type: A
Name: *
Value: 185.209.228.189
TTL: 3600
```

Bu kayıt tüm subdomain'leri kapsar:
- `berg.saastour360.com` → `185.209.228.189`
- `sunset.saastour360.com` → `185.209.228.189`
- `*.saastour360.com` → `185.209.228.189`

**VEYA** sadece `berg` için:
```
Type: A
Name: berg
Value: 185.209.228.189
TTL: 3600
```

### DNS Kontrolü (Sunucuda):
```bash
# Sunucuda DNS'in çözümlendiğini kontrol edin
nslookup berg.saastour360.com
# veya
dig berg.saastour360.com
```

---

## 🔧 2. Sunucuda Traefik Port Ayarları

### Adım 1: Mevcut Port Kullanımını Kontrol Edin

```bash
# Sunucuda çalışan servisleri kontrol edin
sudo netstat -tulpn | grep -E ':(80|443)'
# veya
sudo ss -tulpn | grep -E ':(80|443)'
```

Eğer 80 veya 443 portlarında bir servis çalışıyorsa, durdurun:

```bash
# Örnek: Nginx varsa
sudo systemctl stop nginx
sudo systemctl disable nginx

# Örnek: Apache varsa
sudo systemctl stop apache2
sudo systemctl disable apache2
```

### Adım 2: Traefik Docker Compose Dosyasını Güncelleyin

Sunucuda `infra/traefik/docker-compose.yml` dosyasını düzenleyin:

```bash
cd /var/www/html/saastour360
nano infra/traefik/docker-compose.yml
```

**Şu satırları:**
```yaml
ports:
  - "5001:80"    # Local için
  - "5443:443"   # Local için
  - "8080:8080"
```

**Şu şekilde değiştirin:**
```yaml
ports:
  - "80:80"      # Production için
  - "443:443"    # Production için
  - "8080:8080"  # Dashboard (opsiyonel)
```

### Adım 3: Firewall Kurallarını Kontrol Edin

```bash
# UFW kullanıyorsanız
sudo ufw status
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# veya iptables
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
```

---

## 🗄️ 3. Database'de Tenant Kontrolü

```bash
# PostgreSQL container'a bağlanın
docker exec -it global_postgres psql -U dev_user -d tour_saas
```

SQL sorgusu:
```sql
-- Mevcut tenant'ları kontrol edin
SELECT id, name, slug, category, "isActive" FROM tenants;

-- Eğer 'berg' yoksa oluşturun
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

## 🚀 4. Deployment

### Adım 1: Dosyaları Sunucuya Yükleyin

GitHub Actions otomatik olarak yükleyecek, **VEYA** manuel olarak:

```bash
# Local'den sunucuya
rsync -avz --exclude 'node_modules' --exclude '.git' \
  ./ root@185.209.228.189:/var/www/html/saastour360/
```

### Adım 2: Sunucuda Deployment Script'i Çalıştırın

```bash
# Sunucuya SSH ile bağlanın
ssh root@185.209.228.189

# Proje dizinine gidin
cd /var/www/html/saastour360

# Deployment script'ini çalıştırın
chmod +x deploy.sh
./deploy.sh full
```

Bu script şunları yapacak:
1. Database stack'i başlatacak
2. Web network'ü oluşturacak
3. Traefik'i başlatacak (yeni portlarla)
4. Backend ve Frontend'i build edip başlatacak

---

## ✅ 5. Test ve Doğrulama

### Traefik Loglarını Kontrol Edin:
```bash
docker logs traefik -f
```

### Backend Loglarını Kontrol Edin:
```bash
docker logs saas-tour-backend -f
```

### Container Durumunu Kontrol Edin:
```bash
docker ps
# Şu container'lar çalışıyor olmalı:
# - traefik
# - saas-tour-backend
# - saas-tour-frontend
# - global_postgres
```

### DNS Testi (Sunucudan):
```bash
curl -I http://berg.saastour360.com
# 301 veya 302 redirect beklenir (HTTPS'e)

curl -I https://berg.saastour360.com
# 200 OK beklenir

curl https://berg.saastour360.com/api/health
# {"status":"ok"} gibi bir response
```

### Browser Testi:
1. `https://berg.saastour360.com` adresini açın
2. SSL sertifikasının otomatik olarak oluşturulduğunu kontrol edin
3. Frontend'in yüklendiğini kontrol edin
4. Browser console'da API isteklerinin çalıştığını kontrol edin

---

## 🔍 6. Sorun Giderme

### SSL Sertifikası Alınamıyor:

**Traefik loglarını kontrol edin:**
```bash
docker logs traefik | grep -i acme
docker logs traefik | grep -i certificate
docker logs traefik | grep -i error
```

**Port 80'in açık olduğundan emin olun:**
```bash
curl http://berg.saastour360.com/.well-known/acme-challenge/test
# Let's Encrypt bu portu kullanır
```

### 404 Not Found Hatası:

**Tenant kontrolü:**
```bash
docker exec -it global_postgres psql -U dev_user -d tour_saas -c "SELECT slug FROM tenants WHERE slug = 'berg';"
```

**Backend loglarını kontrol edin:**
```bash
docker logs saas-tour-backend | grep -i tenant
docker logs saas-tour-backend | grep -i error
```

### Container Başlamıyor:

**Docker Compose loglarını kontrol edin:**
```bash
cd /var/www/html/saastour360/infra
docker-compose logs
```

**Network kontrolü:**
```bash
docker network ls | grep web
# 'web' network'ün var olduğundan emin olun
```

---

## 📊 7. Monitoring

### Traefik Dashboard:
```bash
# Sunucu IP'si ile erişim (production'da auth ekleyin!)
http://185.209.228.189:8080
```

### Log Monitoring:
```bash
# Tüm loglar
docker-compose -f infra/docker-compose.yml logs -f

# Sadece Traefik
docker logs traefik -f --tail 100

# Sadece Backend
docker logs saas-tour-backend -f --tail 100
```

---

## 🎯 Hızlı Özet (Sunucuda Yapılacaklar)

1. ✅ **DNS**: `*.saastour360.com` → `185.209.228.189` (domain sağlayıcınızda)
2. ✅ **Port kontrolü**: 80 ve 443 portlarının boş olduğundan emin olun
3. ✅ **Traefik portları**: `infra/traefik/docker-compose.yml` → `80:80` ve `443:443`
4. ✅ **Database**: `berg` tenant'ı kontrol et/oluştur
5. ✅ **Deploy**: `./deploy.sh full` çalıştır
6. ✅ **Test**: `https://berg.saastour360.com`

---

## 🔐 Production Güvenlik Notları

1. **Traefik Dashboard'a Authentication Ekleyin** (şu an insecure)
2. **Firewall kurallarını sıkılaştırın**
3. **Log rotation ayarlayın**
4. **Backup stratejisi oluşturun**

---

## 📞 Sonuç

Sunucuda sadece **port ayarlarını** değiştirmeniz ve **deployment script'ini** çalıştırmanız yeterli. Tüm yapılandırma zaten hazır! 🚀

