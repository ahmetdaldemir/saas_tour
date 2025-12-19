# Multi-Project Database Setup - Aynı Sunucuda Birden Fazla Proje

Bu doküman, aynı sunucuda birden fazla proje çalıştırırken database container'larını paylaşma konusunu açıklar.

## 🔍 Sorun

Aynı sunucuda `kaffateklif.com` ve `saastour360.com` projeleri çalışıyor ve her ikisi de aynı database container isimlerini kullanmaya çalışıyor:

- `global_postgres`
- `global_redis`
- `global_mongodb`
- `global_adminer`
- vb.

Bu durum container isim çakışmasına neden olur.

## ✅ Çözüm: Database Stack'i Paylaşma

**En iyi çözüm**: Tüm projeler aynı database stack'i paylaşmalı. Bu şekilde:

- ✅ Kaynak kullanımı optimize olur
- ✅ Container isim çakışması olmaz
- ✅ Database yönetimi kolaylaşır
- ✅ Backup stratejisi basitleşir

### Nasıl Çalışır?

1. **İlk proje** (`kaffateklif.com` veya `saastour360.com`) database stack'i başlatır
2. **İkinci proje** mevcut container'ları tespit eder ve kullanır
3. Her iki proje de aynı PostgreSQL/Redis/MongoDB instance'larını kullanır
4. Farklı database'ler kullanarak veriler ayrı tutulur:
   - `kaffateklif.com` → `kaffateklif_db`
   - `saastour360.com` → `tour_saas`

## 🔧 Deploy Script Güncellemesi

`deploy.sh` script'i artık mevcut container'ları tespit ediyor ve koruyor:

```bash
# Mevcut container'ları kontrol et
EXISTING_CONTAINERS=$(docker ps -a --filter "name=global_" --format "{{.Names}}")

if [ -n "$EXISTING_CONTAINERS" ]; then
    echo "⚠️  Mevcut database container'ları tespit edildi"
    echo "💾 Mevcut container'lar korunacak (diğer projelerle paylaşılıyor)"
    # Çalışan container'lar korunur, sadece durdurulmuş olanlar kaldırılır
fi
```

## 📋 Database İsimleri

Her proje farklı database ismi kullanmalı:

### kaffateklif.com:
```env
# backend/.env
DB_NAME=kaffateklif_db
```

### saastour360.com:
```env
# backend/.env
DB_NAME=tour_saas
```

## 🚀 Deployment Senaryoları

### Senaryo 1: İlk Proje (Database Stack Yok)

```bash
cd /path/to/first-project
./deploy.sh full
# ✅ Database stack başlatılır
# ✅ Container'lar oluşturulur
```

### Senaryo 2: İkinci Proje (Database Stack Var)

```bash
cd /path/to/second-project
./deploy.sh full
# ✅ Mevcut container'lar tespit edilir
# ✅ Container'lar korunur (yeniden oluşturulmaz)
# ✅ Sadece eksik container'lar başlatılır
```

### Senaryo 3: Container Güncelleme

Eğer database stack'i güncellemek isterseniz:

```bash
# Sadece database stack'i yeniden başlat (tüm projeleri etkiler!)
cd docker-datatabse-stack
docker-compose down
docker-compose up -d
```

## ⚠️ Dikkat Edilmesi Gerekenler

### 1. Fresh DB Modu

`--fresh-db` modu kullanıldığında:

```bash
./deploy.sh full --fresh-db
```

**UYARI**: Mevcut container'lar korunur (diğer projeleri etkilememek için). Sadece durdurulmuş container'lar kaldırılır.

Eğer gerçekten database'i sıfırdan kurmak istiyorsanız:

```bash
# Tüm database container'larını durdur ve volume'ları sil
cd docker-datatabse-stack
docker-compose down -v  # ⚠️ Tüm projelerin verileri silinir!
docker-compose up -d
```

### 2. Port Kullanımı

Database port'ları paylaşıldığı için çakışma olmaz:

- PostgreSQL: `5432` (tüm projeler aynı portu kullanır)
- Redis: `6379`
- MongoDB: `27017`

### 3. Network Yapılandırması

Tüm projeler aynı `global_databases_network` network'ünü kullanır:

```yaml
networks:
  global_databases_network:
    external: true
```

## 🔍 Kontrol Komutları

### Mevcut Container'ları Kontrol Et:

```bash
docker ps --filter "name=global_" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

### Hangi Database'ler Var:

```bash
docker exec global_postgres psql -U dev_user -l
```

### Container Loglarını Kontrol Et:

```bash
docker logs global_postgres -f
```

## 📊 Özet

✅ **Avantajlar:**
- Container isim çakışması yok
- Kaynak kullanımı optimize
- Backup stratejisi basit
- Database yönetimi kolay

⚠️ **Dikkat:**
- Fresh DB modu tüm projeleri etkileyebilir
- Database isimleri farklı olmalı
- Backup stratejisi önemli

## 🎯 Sonuç

`deploy.sh` script'i artık multi-project ortamlarında çalışacak şekilde güncellendi. Mevcut database container'larını tespit eder ve korur, böylece birden fazla proje aynı sunucuda sorunsuz çalışabilir.

