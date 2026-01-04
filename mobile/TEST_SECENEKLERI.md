# Expo Go Dışında Test Etme Seçenekleri

Expo Go uygulaması dışında uygulamanızı test etmenin birkaç yolu var:

## 1. 🌐 Web Tarayıcısında Test (En Kolay)

Web tarayıcısında hızlıca test edebilirsiniz. Ancak bazı native özellikler (kamera, dosya sistemi vb.) çalışmayabilir.

### Kurulum ve Çalıştırma

```bash
cd mobile
npm start
# Terminalde 'w' tuşuna basın
# veya direkt:
npm run web
```

Uygulama otomatik olarak tarayıcıda açılacak (genellikle `http://localhost:8081`).

### Avantajlar
- ✅ Hızlı test
- ✅ Hot reload
- ✅ Debug kolaylığı
- ✅ Native özellikler olmadan UI testi

### Dezavantajlar
- ❌ Kamera çalışmaz
- ❌ Dosya sistemi erişimi sınırlı
- ❌ Bluetooth/Printer çalışmaz
- ❌ Bazı native modüller çalışmayabilir

---

## 2. 🤖 Android Emulator (Android Studio)

Android Studio emülatöründe tam native test yapabilirsiniz.

### Kurulum

1. **Android Studio'yu İndirin ve Kurun**
   - [Android Studio İndir](https://developer.android.com/studio)
   - Android SDK ve emülatör kurulumunu tamamlayın

2. **Android Emulator Oluşturun**
   - Android Studio'yu açın
   - Tools → Device Manager
   - "Create Device" butonuna tıklayın
   - Bir cihaz seçin (örn: Pixel 5)
   - Sistem görüntüsü seçin (API 33+ önerilir)
   - Emülatörü oluşturun

3. **Emülatörü Başlatın**
   - Device Manager'dan emülatörü başlatın
   - Veya komut satırından:
   ```bash
   emulator -avd <emulator_name>
   ```

### Çalıştırma

```bash
cd mobile
npm run android
# veya
npm start
# Terminalde 'a' tuşuna basın
```

Expo otomatik olarak emülatörü bulacak ve uygulamayı yükleyecek.

### Avantajlar
- ✅ Tam native Android testi
- ✅ Tüm özellikler çalışır (kamera, dosya sistemi vb.)
- ✅ Farklı cihaz boyutları test edilebilir
- ✅ Farklı Android versiyonları test edilebilir

### Dezavantajlar
- ❌ Kurulum biraz zaman alır
- ❌ Bilgisayar kaynaklarını kullanır
- ❌ İlk başlatma yavaş olabilir

### Sorun Giderme

**ADB bulunamıyor hatası:**
```bash
# Android SDK path'ini ekleyin (Windows)
set ANDROID_HOME=C:\Users\<KullanıcıAdı>\AppData\Local\Android\Sdk
set PATH=%PATH%;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools
```

**Emülatör yavaş çalışıyorsa:**
- HAXM (Intel) veya Hyper-V (Windows) etkinleştirin
- Emülatör ayarlarından RAM'i artırın (4GB+ önerilir)

---

## 3. 🍎 iOS Simulator (Sadece Mac)

Mac kullanıyorsanız iOS Simulator'da test edebilirsiniz.

### Kurulum

1. **Xcode'u İndirin ve Kurun**
   - Mac App Store'dan Xcode'u indirin
   - Xcode → Preferences → Components → iOS Simulator'ı indirin

2. **iOS Simulator'ı Başlatın**
   - Xcode → Open Developer Tool → Simulator
   - Veya komut satırından:
   ```bash
   open -a Simulator
   ```

### Çalıştırma

```bash
cd mobile
npm run ios
# veya
npm start
# Terminalde 'i' tuşuna basın
```

### Avantajlar
- ✅ Tam native iOS testi
- ✅ Tüm özellikler çalışır
- ✅ Farklı iPhone/iPad modelleri test edilebilir

### Dezavantajlar
- ❌ Sadece Mac'te çalışır
- ❌ Xcode kurulumu büyük (10GB+)

---

## 4. 📱 USB ile Fiziksel Cihaz (Development Build)

Fiziksel cihazınızda test etmek için development build oluşturmanız gerekir.

### Android için

#### Adım 1: Development Build Oluştur

```bash
cd mobile

# EAS CLI'yi global olarak kurun
npm install -g eas-cli

# EAS'a giriş yapın
eas login

# Development build oluşturun
eas build --profile development --platform android
```

Bu işlem birkaç dakika sürebilir. Build tamamlandığında bir APK dosyası indirilecek.

#### Adım 2: Cihaza Yükleyin

1. Android cihazınızda "Geliştirici Seçenekleri"ni etkinleştirin:
   - Ayarlar → Telefon Hakkında → Yapı Numarası'na 7 kez tıklayın
   - Ayarlar → Sistem → Geliştirici Seçenekleri → USB Hata Ayıklama'yı açın

2. Cihazı USB ile bilgisayara bağlayın

3. APK'yı cihaza yükleyin:
   ```bash
   adb install path/to/your-app.apk
   ```

#### Adım 3: Çalıştırın

```bash
npm start
# Terminalde 'a' tuşuna basın veya cihazı seçin
```

### iOS için (Mac gerekli)

```bash
# Development build oluştur
eas build --profile development --platform ios

# Xcode ile cihaza yükle
# veya TestFlight kullan
```

### Avantajlar
- ✅ Gerçek cihaz performansı
- ✅ Tüm özellikler çalışır
- ✅ Gerçek kullanıcı deneyimi

### Dezavantajlar
- ❌ Build süreci zaman alır
- ❌ Her değişiklikte yeniden build gerekebilir
- ❌ iOS için Mac gerekli

---

## 5. 🔧 Expo Development Build (Önerilen)

Expo Go yerine özel development build kullanabilirsiniz. Bu, Expo Go'nun sınırlamaları olmadan test etmenizi sağlar.

### Kurulum

```bash
cd mobile

# EAS CLI kurun
npm install -g eas-cli

# EAS'a giriş yapın
eas login

# EAS projesini başlatın
eas init
```

### Development Build Oluştur

```bash
# Android için
eas build --profile development --platform android

# iOS için (Mac gerekli)
eas build --profile development --platform ios
```

Build tamamlandıktan sonra:
1. APK/IPA dosyasını cihaza yükleyin
2. `npm start` ile development server'ı başlatın
3. Uygulama otomatik olarak development server'a bağlanacak

### Avantajlar
- ✅ Expo Go sınırlamaları yok
- ✅ Custom native modüller kullanabilirsiniz
- ✅ Production'a yakın test ortamı

---

## 6. 📦 Production Build (Son Test)

Production build oluşturup test edebilirsiniz:

```bash
# Android APK
eas build --platform android --profile production

# iOS (Mac gerekli)
eas build --platform ios --profile production
```

---

## Hızlı Karşılaştırma

| Yöntem | Kurulum | Hız | Native Özellikler | Önerilen Kullanım |
|--------|---------|-----|-------------------|-------------------|
| **Web** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ❌ | UI/UX testi |
| **Android Emulator** | ⭐⭐⭐ | ⭐⭐⭐ | ✅ | Android geliştirme |
| **iOS Simulator** | ⭐⭐ | ⭐⭐⭐⭐ | ✅ | iOS geliştirme (Mac) |
| **USB Device** | ⭐⭐⭐ | ⭐⭐ | ✅ | Son test |
| **Dev Build** | ⭐⭐⭐ | ⭐⭐ | ✅ | Production öncesi |

---

## Önerilen Test Akışı

1. **Geliştirme aşaması**: Web tarayıcısı (hızlı iterasyon)
2. **UI/UX testi**: Android/iOS Emulator
3. **Native özellikler**: Fiziksel cihaz (USB veya Dev Build)
4. **Son test**: Production build

---

## Hızlı Başlangıç Komutları

```bash
# Web'de test
npm run web

# Android emülatörde
npm run android

# iOS simülatörde (Mac)
npm run ios

# Development build (Android)
eas build --profile development --platform android

# Production build
eas build --platform android --profile production
```

---

## Sorun Giderme

### Android Emulator Bulunamıyor

```bash
# Emülatör listesini kontrol et
emulator -list-avds

# ADB cihazlarını kontrol et
adb devices
```

### iOS Simulator Bulunamıyor

```bash
# Simulator listesini kontrol et
xcrun simctl list devices

# Simulator'ı başlat
open -a Simulator
```

### Build Hataları

- `eas.json` dosyası oluşturun (EAS CLI otomatik oluşturur)
- API anahtarlarını kontrol edin
- EAS hesabınızın aktif olduğundan emin olun

---

## Notlar

- **Web testi** en hızlı yöntemdir ama native özellikler çalışmaz
- **Emülatör/Simulator** native özellikler için idealdir
- **Development Build** production'a en yakın test ortamıdır
- Her yöntemin kendine özgü avantajları vardır, ihtiyacınıza göre seçin

