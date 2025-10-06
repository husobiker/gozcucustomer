# SafeBase SaaS Test Rehberi

## 🚀 Hızlı Test

### 1. Uygulamayı Başlat

```bash
cd admin-panel
npm start
```

### 2. Test URL'leri

#### Süper Admin Paneli

- **URL**: http://localhost:3000?admin=true
- **Açıklama**: Tüm müşterileri yönetebilirsin
- **Özellikler**: Müşteri listesi, abonelik yönetimi, sistem durumu

#### Müşteri Paneli (ABC Güvenlik)

- **URL**: http://localhost:3000
- **Açıklama**: ABC Güvenlik'in yönetim paneli
- **Özellikler**: Projeler, personel, devriye çizelgeleri, olay kayıtları

### 3. Test Senaryoları

#### Süper Admin Testi

1. `http://localhost:3000?admin=true` adresine git
2. Müşteri listesini gör
3. "Yeni Müşteri" butonuna tıkla
4. Müşteri bilgilerini doldur ve kaydet

#### Müşteri Testi

1. `http://localhost:3000` adresine git
2. ABC Güvenlik logosunu ve ismini gör
3. Sidebar'da "Projeler" menüsüne tıkla
4. Mevcut projeleri gör (ABC Sitesi, XYZ İş Merkezi)
5. "YENİ PROJE" butonuna tıkla ve yeni proje ekle

### 4. Beklenen Sonuçlar

#### Süper Admin Paneli

- ✅ Müşteri listesi görünür
- ✅ İstatistik kartları (Toplam Müşteri, Aktif Müşteri, Aylık Gelir, Sistem Sağlığı)
- ✅ Müşteri ekleme/düzenleme formu çalışır
- ✅ Tab'lar arasında geçiş yapılabilir

#### Müşteri Paneli

- ✅ ABC Güvenlik branding'i görünür
- ✅ Sidebar'da müşteri adı ve plan bilgisi
- ✅ Projeler listesi görünür
- ✅ Yeni proje ekleme çalışır
- ✅ Diğer menüler (Personel, Kontrol Noktaları, vb.) erişilebilir

### 5. Sorun Giderme

#### Veritabanı Hatası

- Supabase bağlantısını kontrol et
- `database/schema.sql` dosyasını Supabase'de çalıştır

#### Tenant Bulunamadı Hatası

- Console'da "Error fetching demo tenant" hatası varsa
- Demo data oluşturulmamış olabilir, sayfayı yenile

#### Süper Admin Görünmüyor

- URL'de `?admin=true` parametresinin olduğundan emin ol
- Console'da hata var mı kontrol et

### 6. Sonraki Adımlar

1. **Gerçek Subdomain Testi**: Hosts dosyasını güncelle
2. **Abonelik Limitleri**: Plan limitlerini kontrol et
3. **Ödeme Sistemi**: Stripe entegrasyonu
4. **Bildirim Sistemi**: Email/SMS entegrasyonu
5. **Mobil Uygulama**: React Native entegrasyonu

## 📝 Notlar

- Şu an localhost'ta demo tenant (ABC Güvenlik) yükleniyor
- Gerçek subdomain testi için hosts dosyası güncellemesi gerekli
- Tüm veriler Supabase'de saklanıyor
- RLS (Row Level Security) ile veri izolasyonu sağlanıyor
