# SaaS Tour API - Postman Collection

Bu klasör, SaaS Tour API için Postman Collection içerir.

## Dosyalar

- `SaaS-Tour-API.postman_collection.json` - Postman Collection v2.1 formatında
- `openapi-spec.json` - OpenAPI 3.0 specification (backup)

## Kullanım

### Postman'e İçe Aktarma

1. Postman uygulamasını açın
2. **Import** butonuna tıklayın
3. `SaaS-Tour-API.postman_collection.json` dosyasını seçin
4. Collection'ınız hazır!

### Collection Variables

Collection şu değişkenleri içerir:

- `base_url`: `http://berg.local.saastour360.test:5001/api` (Local development)
- `auth_token`: JWT token (login sonrası buraya kopyalanmalı)
- `tenant`: `berg` (Tenant slug)

### Önerilen İş Akışı

1. **Login**: `Auth > User login` endpoint'ini kullanarak giriş yapın
2. **Token'ı Kaydedin**: Response'dan gelen `token` değerini `auth_token` variable'ına kopyalayın
3. **Diğer Endpoint'leri Test Edin**: Artık authenticated request'leri gönderebilirsiniz

### Collection İstatistikleri

- **Toplam Folder**: 33
- **Toplam Request**: 172
- **Ana Kategoriler**:
  - Auth (Authentication)
  - Tenants
  - Rent a Car (Vehicles, Locations, Pricing, Extras)
  - Transfer (Vehicles, Routes, Pricing, Reservations, Drivers)
  - Tours & Tour Features
  - Reservations
  - Customers (CRM)
  - Settings
  - Blogs, Hotels, Destinations
  - Languages, Currencies, Translations
  - Email Templates
  - Chat & Chat Widget
  - Admin & Monitoring

## Swagger UI

API dokümantasyonunu görsel olarak görmek için:

- **Local (Multi-tenant)**: http://berg.local.saastour360.test:5001/api/docs/ui
- **Local (Direct)**: http://localhost:4001/api/docs/ui

## Güncelleme

Collection'ı güncellemek için:

```bash
# OpenAPI spec'i indir
curl -H "Host: berg.local.saastour360.test" http://localhost:5001/api/docs > postman/openapi-spec.json

# Collection'ı yeniden oluştur
python3 postman/convert-openapi-to-postman.py
```

veya `postman/convert-openapi-to-postman.js` script'ini kullanın.

## Notlar

- Tüm authenticated endpoint'ler Bearer token kullanır
- Multi-tenant yapı nedeniyle Host header'ı önemlidir (Traefik routing için)
- Local development için default tenant: `berg`
- Production için tenant slug'ını değiştirmeyi unutmayın

