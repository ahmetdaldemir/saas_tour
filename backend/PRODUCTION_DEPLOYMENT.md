# Production Deployment Guide

## Production Image İçeriği

Production Docker image'inde **sadece** aşağıdaki dosyalar/klasörler bulunur:

### ✅ Olması Gerekenler

1. **`dist/`** - Compiled JavaScript dosyaları (TypeScript'ten derlenmiş)
2. **`node_modules/`** - Production dependencies only
3. **`public/`** - Static files (widget.js, uploads klasörü)
4. **`.env`** - Environment variables (sunucuda ayrı oluşturulur)
5. **`package.json`** - Dependency listesi
6. **`package-lock.json`** - Locked dependency versions

### ❌ Olmaması Gerekenler

1. **`src/`** - Source code (TypeScript dosyaları) ❌
2. **`tsconfig.json`** - TypeScript config ❌
3. **`*.ts`** - TypeScript source files ❌
4. **`.git/`** - Git repository ❌
5. **Development dependencies** - `ts-node`, `typescript`, vb. ❌

## Dockerfile Yapısı

Production image iki aşamalı build kullanır:

1. **Builder Stage**: TypeScript derleme
   - `src/` klasörü burada kullanılır
   - `npm run build` ile `dist/` oluşturulur
   - Bu stage final image'e dahil edilmez

2. **Production Stage**: Runtime
   - Sadece `dist/` klasörü kopyalanır
   - `npm ci --only=production` ile sadece production dependencies yüklenir
   - `src/` ve `tsconfig.json` kopyalanmaz

## Seed Script'leri

Production'da seed script'leri çalıştırmak için:

### ✅ Doğru Yöntem (Compiled Versiyon)

```bash
# deploy.sh kullanarak
./deploy.sh seed
./deploy.sh seed:global

# Veya direkt compiled versiyon
docker exec -it saas-tour-backend node dist/scripts/seed-mock-data.js
```

### ❌ Yanlış Yöntem (ts-node ile)

```bash
# Bu çalışmaz çünkü src/ klasörü yok
docker exec -it saas-tour-backend npm run seed:mock
```

## Güvenlik

Production image'inde source code olmaması:

- ✅ **Güvenlik**: Source code görünmez
- ✅ **Boyut**: Daha küçük image size
- ✅ **Best Practice**: Industry standard
- ✅ **IP Protection**: Kod koruması

## Maintenance Script'leri

Eğer production'da maintenance script'leri çalıştırmanız gerekiyorsa:

1. Script'i local'de derleyin: `npm run build`
2. Compiled versiyonu kullanın: `node dist/scripts/your-script.js`
3. Veya ayrı bir maintenance container kullanın (development dependencies ile)

## Kontrol

Production container'ında ne olduğunu kontrol etmek için:

```bash
# Container'a gir
docker exec -it saas-tour-backend sh

# Klasör yapısını kontrol et
ls -la

# src/ klasörünün olmadığını doğrula
ls src  # Hata vermeli: "ls: src: No such file or directory"

# dist/ klasörünün olduğunu doğrula
ls dist  # Başarılı olmalı
```

## Notlar

- `.env` dosyası Dockerfile'da kopyalanmaz, sunucuda ayrı oluşturulur
- `uploads/` klasörü `public/uploads/` içinde oluşturulur
- Development için `seed.sh` script'i kullanılabilir (local'de `src/` var)
- Production'da seed için `deploy.sh seed` kullanılmalı (compiled versiyon)

