# Pomodoro Odaklanma Takibi ve Raporlama Uygulaması

**T.C. SAKARYA ÜNİVERSİTESİ**  
**BİLGİSAYAR MÜHENDİSLİĞİ BÖLÜMÜ**  
**BSM 447 - MOBİL UYGULAMA GELİŞTİRME DERSİ DÖNEM PROJESİ**

## Proje Hakkında

Bu uygulama, kullanıcıların odaklanma seanslarını takip etmelerine, dikkat dağınıklıklarını izlemelerine ve detaylı raporlar görmelerine olanak sağlayan bir Pomodoro zamanlayıcı uygulamasıdır.

### Teknolojiler
- **Framework**: React Native (Expo)
- **Navigation**: React Navigation (Tab Navigator & Stack Navigator)
- **State Management**: React Context API
- **Local Storage**: AsyncStorage
- **Veritabanı**: AsyncStorage (MongoDB Atlas entegrasyonu için hazır)
- **Charts**: react-native-chart-kit
- **Backend**: MongoDB Atlas (opsiyonel - entegrasyon için hazır)

## Özellikler

### ✅ Temel Özellikler (MVP)

#### 1. Kimlik Doğrulama
- ✅ Login/Kayıt ekranı
- ✅ Kullanıcı oturumu yönetimi
- ✅ AsyncStorage ile kalıcı oturum

#### 2. Zamanlayıcı Ekranı (Ana Sayfa)
- ✅ 25 dakikalık Pomodoro sayacı (ayarlanabilir)
- ✅ Başlat, Duraklat, Sıfırla butonları
- ✅ Kategori seçimi (Ders Çalışma, Kodlama, Proje, Kitap Okuma, Diğer)
- ✅ Seans tamamlandığında özet gösterimi
- ✅ Süre ayarlama (+5/-5 dakika)

#### 3. Dikkat Dağınıklığı Takibi
- ✅ AppState API ile uygulamadan çıkış tespiti
- ✅ Uygulamadan ayrıldığında otomatik sayaç durması
- ✅ Dikkat dağınıklığı sayacı
- ✅ Her dikkat dağınıklığı kaydedilir

#### 4. Raporlar Ekranı (Dashboard)
- ✅ Bugün toplam odaklanma süresi
- ✅ Tüm zamanların toplam odaklanma süresi
- ✅ Toplam dikkat dağınıklığı sayısı
- ✅ Son 7 güne ait çubuk grafik (Bar Chart)
- ✅ Kategorilere göre pasta grafik (Pie Chart)
- ✅ Pull-to-refresh özelliği

#### 5. Navigasyon
- ✅ Alt menü (Tab Navigator) ile ekranlar arası geçiş
- ✅ Icon'lu ve renkli navigasyon

## Kurulum

### Gereksinimler
- Node.js (v14 veya üzeri)
- npm veya yarn
- Expo CLI
- Android Studio (Android emülatör için) veya fiziksel cihaz
- iOS için Xcode (macOS üzerinde)

### Adımlar

1. **Projeyi klonlayın**
```bash
git clone https://github.com/azranurtekbas/pomodoro_timer.git
cd pomodoro_timer
```

2. **Bağımlılıkları yükleyin**
```bash
npm install
```

3. **Uygulamayı başlatın**
```bash
npm start
```

veya

```bash
expo start
```

4. **Android Studio ile çalıştırma**
- Android Studio'yu açın
- AVD Manager'dan bir emülatör başlatın
- Terminal'de şu komutu çalıştırın:
```bash
npm run android
```

5. **Fiziksel cihazda çalıştırma**
- Expo Go uygulamasını telefonunuza indirin
- QR kodu Expo Go ile tarayın

## Proje Yapısı

```
pomodoro_timer/
├── assets/                    # Uygulama varlıkları (icon, splash vb.)
├── src/
│   ├── components/           # Yeniden kullanılabilir bileşenler
│   ├── constants/            # Sabitler ve yapılandırma
│   │   └── index.js         # Kategoriler, zaman sabitleri
│   ├── context/             # React Context providers
│   │   └── AuthContext.js   # Kimlik doğrulama context'i
│   ├── navigation/          # Navigasyon yapılandırması
│   │   ├── AppNavigator.js  # Ana navigasyon
│   │   └── MainNavigator.js # Tab navigasyonu
│   ├── screens/             # Uygulama ekranları
│   │   ├── LoginScreen.js   # Giriş ekranı
│   │   ├── TimerScreen.js   # Zamanlayıcı ekranı
│   │   └── ReportsScreen.js # Raporlar ekranı
│   └── services/            # Servis katmanı
│       └── database.js      # Veritabanı işlemleri
├── App.js                   # Ana uygulama dosyası
├── app.json                 # Expo yapılandırması
├── package.json             # Proje bağımlılıkları
└── babel.config.js          # Babel yapılandırması
```

## Kullanım

### 1. Giriş Yapma
- Uygulama ilk açıldığında login ekranı görüntülenir
- Kullanıcı adı ve şifre girerek giriş yapın
- (Şu anda basit bir kimlik doğrulama sistemi kullanılıyor)

### 2. Pomodoro Seansı Başlatma
1. Zamanlayıcı ekranında kategori seçin
2. İsterseniz +5/-5 butonları ile süreyi ayarlayın
3. "Başlat" butonuna tıklayın
4. Sayaç başlayacaktır

### 3. Seans Sırasında
- Sayaç çalışırken uygulamadan ayrılırsanız, dikkat dağınıklığı sayılır
- Sayaç otomatik olarak duraklar
- "Duraklat" ile manuel olarak duraklatabilirsiniz
- "Sıfırla" ile sıfırlayabilirsiniz
- "Bitir ve Kaydet" ile seans özetini görebilirsiniz

### 4. Raporları Görüntüleme
- Alt menüden "Raporlar" sekmesine geçin
- Günlük ve toplam istatistiklerinizi görün
- Son 7 günün grafiğini inceleyin
- Kategorilere göre dağılımı görün
- Aşağı çekerek verileri yenileyin

## MongoDB Entegrasyonu

Proje, MongoDB Atlas ile entegre edilmeye hazır bir yapıya sahiptir. Backend API kurulumu için:

1. **Backend API Oluşturma**
   - Node.js + Express ile bir backend API oluşturun
   - MongoDB Atlas hesabı açın ve cluster oluşturun
   - Mongoose ile bağlantı kurun

2. **API Yapılandırması**
   - `src/constants/index.js` dosyasındaki `API_CONFIG.BASE_URL` değerini backend API URL'iniz ile değiştirin

3. **Endpoints**
   - `/auth/login` - Kullanıcı girişi
   - `/auth/register` - Kullanıcı kaydı
   - `/sessions` - Seans verileri (GET, POST)
   - `/stats` - İstatistikler

4. **Servis Entegrasyonu**
   - `src/services/database.js` dosyasındaki `syncToMongoDB` metodunu aktif edin
   - AsyncStorage yerine API çağrıları yapacak şekilde güncelleyin

## Önemli Notlar

- ⚠️ Asset dosyaları (icon.png, splash.png, vb.) eklenmelidir
- ⚠️ MongoDB entegrasyonu için backend API gereklidir
- ⚠️ Şu anda veriler sadece cihazda (AsyncStorage) saklanmaktadır
- ⚠️ Production için güvenlik önlemleri alınmalıdır

## Test Etme

### Fonksiyonel Test Senaryoları

1. **Login Testi**
   - Kullanıcı adı ve şifre ile giriş yapın
   - Uygulama ana ekrana yönlendirmeli

2. **Zamanlayıcı Testi**
   - Kategori seçin
   - Zamanlayıcıyı başlatın
   - Uygulamadan çıkın (home tuşuna basın)
   - Tekrar uygulamaya dönün
   - Dikkat dağınıklığı sayısının artmış olması gerekir

3. **Raporlar Testi**
   - Birkaç seans tamamlayın
   - Raporlar ekranına gidin
   - İstatistiklerin güncellenmesi gerekir
   - Grafiklerin görüntülenmesi gerekir

### Verileri Temizleme
- Raporlar ekranının altındaki "Tüm Verileri Temizle" butonu ile test verilerini silebilirsiniz

## Sorun Giderme

### Expo başlatma hatası
```bash
npm install -g expo-cli
expo start --clear
```

### Metro bundler hatası
```bash
npm start -- --reset-cache
```

### Android Studio emülatör bağlantı sorunu
```bash
adb devices
adb reverse tcp:8081 tcp:8081
```

## Gelecek Geliştirmeler

- [ ] MongoDB Atlas backend entegrasyonu
- [ ] Push notifications (seans bittiğinde)
- [ ] Sesli bildirimler
- [ ] Dark mode
- [ ] Kullanıcı profil yönetimi
- [ ] Seans geçmişi detay sayfası
- [ ] Hedef belirleme sistemi
- [ ] Arkadaşlarla rekabet özelliği
- [ ] Widget desteği

## Katkıda Bulunma

1. Bu repository'yi fork edin
2. Feature branch oluşturun (`git checkout -b feature/AmazingFeature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add some AmazingFeature'`)
4. Branch'inizi push edin (`git push origin feature/AmazingFeature`)
5. Pull Request oluşturun

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## İletişim

Azra Nur Tekbaş - [@azranurtekbas](https://github.com/azranurtekbas)

Proje Link: [https://github.com/azranurtekbas/pomodoro_timer](https://github.com/azranurtekbas/pomodoro_timer)

---

**Not**: Bu proje, Sakarya Üniversitesi Bilgisayar Mühendisliği Bölümü BSM 447 Mobil Uygulama Geliştirme dersi için geliştirilmiştir.
