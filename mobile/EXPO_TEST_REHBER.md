# Expo ile Telefonda Test Etme Rehberi

## Ön Hazırlık

### 1. Expo Go Uygulamasını Yükleyin

Telefonunuza Expo Go uygulamasını yükleyin:
- **Android**: [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
- **iOS**: [App Store](https://apps.apple.com/app/expo-go/id982107779)

### 2. Backend'in Çalıştığından Emin Olun

Backend sunucunuzun çalışıyor olması gerekiyor:
```bash
cd backend
npm run dev
# veya
npm start
```

Backend genellikle `http://localhost:4001` adresinde çalışır.

### 3. Bilgisayarınızın IP Adresini Bulun

Telefonunuzdan bilgisayarınıza bağlanabilmek için bilgisayarınızın yerel IP adresini bulmanız gerekiyor:

**Windows PowerShell'de:**
```powershell
ipconfig
```
`IPv4 Address` değerini not edin (örn: `192.168.1.100`)

**Mac/Linux'da:**
```bash
ifconfig
# veya
ip addr show
```

### 4. API URL'ini Güncelleyin

`mobile/app.json` dosyasında `apiBaseUrl` değerini bilgisayarınızın IP adresi ile güncelleyin:

```json
"extra": {
  "apiBaseUrl": "http://192.168.1.100:4001/api"
}
```

**ÖNEMLİ:** `localhost` yerine bilgisayarınızın IP adresini kullanın!

## Expo'yu Başlatma

### 1. Mobile Klasörüne Gidin

```bash
cd mobile
```

### 2. Expo Development Server'ı Başlatın

```bash
npm start
```

Bu komut Expo development server'ı başlatacak ve terminalde bir QR kod gösterecek.

### 3. Telefonda QR Kodu Tarayın

1. Telefonunuzda Expo Go uygulamasını açın
2. "Scan QR Code" seçeneğine tıklayın
3. Terminalde görünen QR kodu tarayın
4. Uygulama telefonunuzda yüklenecek

## Alternatif Yöntemler

### Tunnel Modu (İnternet Gerektirir)

Eğer telefon ve bilgisayar aynı ağda değilse, tunnel modunu kullanabilirsiniz:

```bash
npm start -- --tunnel
```

Bu mod daha yavaş olabilir ama internet üzerinden çalışır.

### LAN Modu (Aynı WiFi Ağında)

Telefon ve bilgisayar aynı WiFi ağındaysa:

```bash
npm start -- --lan
```

## Sorun Giderme

### QR Kod Görünmüyor

Terminalde `s` tuşuna basarak QR kodu tekrar görebilirsiniz.

### Bağlantı Hatası

1. **Firewall Kontrolü**: Windows Firewall'un 19000, 8081, 8082 portlarını engellemediğinden emin olun
2. **Ağ Kontrolü**: Telefon ve bilgisayarın aynı WiFi ağında olduğundan emin olun
3. **IP Adresi**: `app.json`'daki IP adresinin doğru olduğundan emin olun

### API Bağlantı Hatası

1. Backend'in çalıştığından emin olun
2. `app.json`'daki `apiBaseUrl` değerini kontrol edin
3. Backend'in CORS ayarlarının mobil cihazlardan gelen isteklere izin verdiğinden emin olun

### Expo Go'da Uygulama Açılmıyor

1. Expo Go uygulamasının güncel olduğundan emin olun
2. `npm start` komutunu tekrar çalıştırın
3. QR kodu yeniden tarayın

## Hızlı Başlangıç Komutları

```bash
# 1. Bağımlılıkları yükle (ilk kez)
cd mobile
npm install

# 2. API URL'ini güncelle (app.json)
# Bilgisayarınızın IP adresini kullanın

# 3. Expo'yu başlat
npm start

# 4. QR kodu telefonunuzla tara
```

## Notlar

- İlk yükleme biraz zaman alabilir
- Kod değişikliklerinde uygulama otomatik olarak yenilenecek (Hot Reload)
- Backend'i yeniden başlattığınızda mobil uygulamayı da yeniden yüklemeniz gerekebilir
- Production API kullanmak isterseniz: `https://api.saastour360.com/api`

