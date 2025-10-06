# Gozcu360 Admin Panel

Güvenlik yönetim platformu için kapsamlı admin paneli.

## 🚀 Özellikler

- **Dashboard**: Analitik ve genel bakış
- **Kullanıcı Yönetimi**: Personel ve kullanıcı işlemleri
- **Proje Yönetimi**: Güvenlik projeleri ve bölgeler
- **Vardiya Sistemi**: Görev planlaması ve vardiya yönetimi
- **Ödeme Sistemi**: Bordro ve ödeme işlemleri
- **Kontrol Noktaları**: Devriye ve kontrol noktası yönetimi
- **Olay Yönetimi**: Güvenlik olayları ve raporlama
- **Formlar ve Şablonlar**: Dinamik form sistemi
- **Raporlar ve Analitik**: Detaylı raporlama
- **Kurumsal Ayarlar**: Şirket konfigürasyonu
- **GIB Entegrasyonu**: E-fatura ve muhasebe
- **Banka Hesapları**: Nakit akış yönetimi
- **Kamera Entegrasyonu**: Hikvision kamera sistemi
- **SGK Yönetimi**: SGK işlemleri ve takibi
- **İzin Yönetimi**: Personel izin sistemi
- **Envanter Yönetimi**: Stok ve transfer işlemleri
- **Satış ve Faturalama**: Müşteri faturaları
- **Yedekleme ve Geri Yükleme**: Veri güvenliği
- **Sistem İzleme**: Performans takibi

## 🛠️ Teknoloji Stack

- **Frontend**: React 18, Material-UI, TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Routing**: React Router
- **State Management**: React Context API
- **Charts**: Recharts
- **Maps**: Leaflet, React-Leaflet
- **PDF**: jsPDF, PDFMake
- **QR Code**: QRCode.js
- **Date Handling**: date-fns

## 📁 Proje Yapısı

```
admin-panel/
├── src/
│   ├── components/         # React bileşenleri
│   ├── contexts/           # Context API
│   ├── hooks/              # Custom hooks
│   ├── services/           # API servisleri
│   ├── utils/              # Yardımcı fonksiyonlar
│   └── types/              # TypeScript tipleri
├── docs/                   # Dokümantasyon
├── migrations/             # SQL migration dosyaları
├── public/                 # Statik dosyalar
└── build/                  # Production build
```

## 🚀 Kurulum

1. **Bağımlılıkları yükle:**

```bash
npm install
```

2. **Environment değişkenlerini ayarla:**

```bash
cp env.example .env
# .env dosyasını düzenle
```

3. **Geliştirme sunucusunu başlat:**

```bash
npm start
```

4. **Production build:**

```bash
npm run build
```

## 📚 Dokümantasyon

Detaylı dokümantasyon için `docs/` klasörüne bakın:

- [DATABASE-SETUP.md](docs/DATABASE-SETUP.md) - Veritabanı kurulumu
- [SGK_KULLANIM_DOKUMANTASYONU.md](docs/SGK_KULLANIM_DOKUMANTASYONU.md) - SGK entegrasyonu
- [SHIFT-SYSTEMS-DEPLOYMENT.md](docs/SHIFT-SYSTEMS-DEPLOYMENT.md) - Vardiya sistemi
- [LEAVE-TYPES-SETUP.md](docs/LEAVE-TYPES-SETUP.md) - İzin türleri
- [SAAS-TEST.md](docs/SAAS-TEST.md) - SaaS test süreci
- [hosts-setup.md](docs/hosts-setup.md) - Host konfigürasyonu

## 🔧 Geliştirme

### Scripts

- `npm start` - Geliştirme sunucusu
- `npm run build` - Production build
- `npm test` - Test çalıştır
- `npm run eject` - Webpack konfigürasyonunu çıkar

### Port Ayarları

- **Geliştirme**: Port 3001
- **Production**: Port 3001

## 🌐 Deployment

### PM2 ile Deployment

```bash
# PM2 ile başlat
pm2 start npm --name "gozcu360-admin" -- start -- --port 3001

# PM2 durum kontrolü
pm2 status

# PM2 logları
pm2 logs gozcu360-admin
```

### Nginx Konfigürasyonu

```nginx
server {
    listen 80;
    server_name admin.gozcu360.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## 📞 Destek

Sorularınız için:

- **Email**: info@gozcu360.com
- **Website**: https://gozcu360.com

## 📄 Lisans

Bu proje özel mülkiyettir. Tüm hakları saklıdır.

---

**Gözcü Yazılım Teknoloji Ar-ge Ltd. Şti.**
