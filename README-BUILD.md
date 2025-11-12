# 🚀 Otomatik Build Kullanımı

## Tek Seferlik Build

```powershell
.\build.ps1
```

## Watch Modu (Otomatik Build)

Dosya değişikliklerini izler ve otomatik olarak build eder:

```powershell
.\build.ps1 -Watch
```

### Watch Modu Özellikleri:
- ✅ `backend/src` ve `frontend/src` klasörlerindeki değişiklikleri izler
- ✅ Değişiklik olduğunda 2 saniye bekler (debounce)
- ✅ Otomatik olarak Docker build yapar
- ✅ Ctrl+C ile çıkış yapabilirsiniz

### Örnek Kullanım:

1. **Watch modunu başlat:**
   ```powershell
   .\build.ps1 -Watch
   ```

2. **Kodunuzu düzenleyin** (örneğin `backend/src/modules/tour/services/tour.service.ts`)

3. **Dosyayı kaydedin** - Script otomatik olarak build edecek!

4. **Çıkmak için:** `Ctrl+C`

---

## Manuel Build

Eğer watch modu kullanmak istemiyorsanız, her değişiklikten sonra manuel olarak:

```powershell
docker-compose -f infra/docker-compose.yml up -d --build
```

veya

```powershell
cd infra
docker-compose up -d --build
```

---

## Notlar

- İlk build biraz uzun sürebilir (dependencies yükleniyor)
- Sonraki build'ler daha hızlı olacaktır (cache kullanılıyor)
- Watch modu sadece `backend/src` ve `frontend/src` klasörlerini izler
- Diğer dosyalar (ör. `docker-compose.yml`) değişirse manuel build gerekir

