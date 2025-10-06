# SGK Entegrasyon Kullanım Dokümantasyonu

## İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Kurulum ve Yapılandırma](#kurulum-ve-yapılandırma)
3. [SGK Kimlik Bilgileri](#sgk-kimlik-bilgileri)
4. [İşe Giriş İşlemleri](#işe-giriş-işlemleri)
5. [İşten Çıkış İşlemleri](#işten-çıkış-işlemleri)
6. [Sorgulama İşlemleri](#sorgulama-işlemleri)
7. [PDF Doküman Yönetimi](#pdf-doküman-yönetimi)
8. [Toplu İşlemler](#toplu-işlemler)
9. [Nakil İşlemleri](#nakil-işlemleri)
10. [Dönem Hesaplama](#dönem-hesaplama)
11. [Test Ortamı](#test-ortamı)
12. [SOAP Client Yönetimi](#soap-client-yönetimi)
13. [Güvenlik ve Şifreleme](#güvenlik-ve-şifreleme)
14. [İşlem Loglama ve Denetim](#işlem-loglama-ve-denetim)
15. [Bildirim Sistemi](#bildirim-sistemi)
16. [Raporlama ve Analiz](#raporlama-ve-analiz)
17. [Entegrasyon Testleri](#entegrasyon-testleri)
18. [Hata Yönetimi](#hata-yönetimi)
19. [Sık Sorulan Sorular](#sık-sorulan-sorular)
20. [Teknik Destek](#teknik-destek)

## Genel Bakış

SGK Entegrasyon modülü, Sosyal Güvenlik Kurumu'nun 4A sigortalı işe giriş ve işten çıkış web servisleri ile tam entegrasyon sağlar. Bu modül, personel yönetimi sisteminizde SGK işlemlerini otomatikleştirir ve yasal yükümlülüklerinizi yerine getirmenizi kolaylaştırır.

### Temel Özellikler

- ✅ İşe giriş bildirimi
- ✅ İşten çıkış bildirimi
- ✅ SGK sorgulama işlemleri
- ✅ PDF doküman yönetimi
- ✅ Toplu işlem desteği (10 sigortalıya kadar)
- ✅ Nakil işlemleri (aynı işveren farklı işyeri)
- ✅ Dönem hesaplama sistemi
- ✅ Test ortamı entegrasyonu
- ✅ SOAP client yönetimi
- ✅ Güvenlik ve şifreleme
- ✅ İşlem loglama ve denetim
- ✅ Bildirim sistemi
- ✅ Raporlama ve analiz
- ✅ Entegrasyon testleri

## Kurulum ve Yapılandırma

### Gereksinimler

- Supabase veritabanı erişimi
- SGK web servisleri erişim bilgileri
- İşyeri sicil numarası
- SGK kullanıcı adı ve şifresi

### Veritabanı Kurulumu

SGK entegrasyonu için gerekli veritabanı tablolarını oluşturmak için `create-sgk-tables.sql` dosyasını Supabase SQL Editor'da çalıştırın.

```sql
-- Supabase SQL Editor'da çalıştırın
-- create-sgk-tables.sql dosyasının içeriğini kopyalayıp yapıştırın
```

## SGK Kimlik Bilgileri

### Kimlik Bilgilerini Girme

1. Personel kartında **SGK** sekmesine gidin
2. **SGK Kimlik Bilgileri** bölümünde **Ayarlar** butonuna tıklayın
3. Açılan dialog'da gerekli bilgileri girin:
   - **Kullanıcı Adı**: SGK web servisleri kullanıcı adınız
   - **Şifre**: SGK web servisleri şifreniz
   - **İşyeri Sicil**: İşyeri sicil numaranız
   - **Test Modu**: Test ortamı kullanımı için işaretleyin

### Güvenlik

- Kimlik bilgileri şifrelenerek saklanır
- Test modu aktif olduğunda gerçek SGK servisleri çağrılmaz
- Kimlik bilgileri sadece yetkili kullanıcılar tarafından görülebilir

## İşe Giriş İşlemleri

### Tekil İşe Giriş

1. Personel kartında **SGK** sekmesine gidin
2. **İşe Giriş** tabında **Yeni İşe Giriş** butonuna tıklayın
3. Gerekli bilgileri doldurun:
   - **TC Kimlik No**: Personelin TC kimlik numarası
   - **Ad**: Personelin adı
   - **Soyad**: Personelin soyadı
   - **Giriş Tarihi**: İşe giriş tarihi
   - **Sigorta Türü**: Sigorta türü (4A, 4B, 4C)
   - **Görev Kodu**: Personelin görev kodu
   - **Meslek Kodu**: Personelin meslek kodu
   - **ÇSGB İş Kolu**: Çalışma ve Sosyal Güvenlik Bakanlığı iş kolu
   - **Öğrenim Kodu**: Personelin öğrenim durumu
   - **Kısmi Süreli**: Kısmi süreli çalışma durumu
   - **Kısmi Süreli Gün Sayısı**: Haftalık çalışma gün sayısı

### Toplu İşe Giriş

1. **Toplu İşlemler** bölümünde **Toplu İşe Giriş** butonuna tıklayın
2. Excel dosyasından personel bilgilerini yükleyin
3. Veri doğrulama işlemini tamamlayın
4. Toplu işlemi başlatın

### İşe Giriş Sonuçları

- İşlem sonuçları **İşe Giriş Kayıtları** tabında görüntülenir
- Başarılı işlemler yeşil, hatalı işlemler kırmızı renkte gösterilir
- SGK referans kodu ve hata kodları kaydedilir

## İşten Çıkış İşlemleri

### Tekil İşten Çıkış

1. Personel kartında **SGK** sekmesine gidin
2. **İşten Çıkış** tabında **Yeni İşten Çıkış** butonuna tıklayın
3. Gerekli bilgileri doldurun:
   - **TC Kimlik No**: Personelin TC kimlik numarası
   - **Ad**: Personelin adı
   - **Soyad**: Personelin soyadı
   - **Çıkış Tarihi**: İşten çıkış tarihi
   - **İşten Çıkış Nedeni**: Çıkış nedeni kodu
   - **Meslek Kodu**: Personelin meslek kodu
   - **ÇSGB İş Kolu**: Çalışma ve Sosyal Güvenlik Bakanlığı iş kolu

### Toplu İşten Çıkış

1. **Toplu İşlemler** bölümünde **Toplu İşten Çıkış** butonuna tıklayın
2. Excel dosyasından personel bilgilerini yükleyin
3. Veri doğrulama işlemini tamamlayın
4. Toplu işlemi başlatın

### İşten Çıkış Sonuçları

- İşlem sonuçları **İşten Çıkış Kayıtları** tabında görüntülenir
- Başarılı işlemler yeşil, hatalı işlemler kırmızı renkte gösterilir
- SGK referans kodu ve hata kodları kaydedilir

## Sorgulama İşlemleri

### TC Kimlik No ile Sorgulama

1. **Sorgulama** tabında **TC Kimlik No ile Sorgula** butonuna tıklayın
2. TC kimlik numarasını girin
3. Sorgulama türünü seçin (İşe Giriş veya İşten Çıkış)
4. Sorgulama işlemini başlatın

### Tarih ile Sorgulama

1. **Sorgulama** tabında **Tarih ile Sorgula** butonuna tıklayın
2. TC kimlik numarasını ve tarihi girin
3. Sorgulama türünü seçin
4. Sorgulama işlemini başlatın

### Sorgulama Sonuçları

- Sorgulama sonuçları **Sorgulama Geçmişi** bölümünde görüntülenir
- Bulunan kayıt sayısı ve detayları gösterilir
- SGK'dan dönen tam yanıt JSON formatında saklanır

## PDF Doküman Yönetimi

### PDF Oluşturma

1. İşe giriş veya işten çıkış işlemi tamamlandıktan sonra
2. **PDF Dokümanlar** tabında **PDF Oluştur** butonuna tıklayın
3. Doküman türünü seçin (İşe Giriş veya İşten Çıkış)
4. PDF oluşturma işlemini başlatın

### PDF İndirme

1. **PDF Dokümanlar** tabında oluşturulan PDF'leri görüntüleyin
2. **İndir** butonuna tıklayarak PDF'i indirin
3. İndirme sayısı otomatik olarak güncellenir

### PDF Yönetimi

- PDF dosyaları veritabanında BYTEA formatında saklanır
- Dosya boyutu ve hash değeri kontrol edilir
- İndirme geçmişi ve sayısı takip edilir

## Toplu İşlemler

### Toplu İşlem Oluşturma

1. **Toplu İşlemler** bölümünde **Yeni Toplu İşlem** butonuna tıklayın
2. İşlem türünü seçin (İşe Giriş veya İşten Çıkış)
3. Toplu işlem adını girin
4. Personel listesini yükleyin (Excel formatında)

### Toplu İşlem Yürütme

1. Oluşturulan toplu işlemi seçin
2. **Çalıştır** butonuna tıklayın
3. İşlem ilerlemesini takip edin
4. Sonuçları kontrol edin

### Toplu İşlem Sonuçları

- Toplam işlem sayısı
- Başarılı işlem sayısı
- Başarısız işlem sayısı
- Çalışan işlem sayısı
- İşlem süresi

## Nakil İşlemleri

### Nakil Oluşturma

1. **Nakil İşlemleri** bölümünde **Yeni Nakil** butonuna tıklayın
2. Nakil bilgilerini girin:
   - **Personel**: Nakil edilecek personel
   - **Nakil Tipi**: İşe Giriş veya İşten Çıkış
   - **Kaynak İşyeri Sicil**: Mevcut işyeri sicil
   - **Hedef İşyeri Sicil**: Hedef işyeri sicil
   - **Nakil Tarihi**: Nakil tarihi
   - **Nakil Nedeni**: Nakil nedeni

### Nakil Yürütme

1. Oluşturulan nakil işlemini seçin
2. **Çalıştır** butonuna tıklayın
3. Nakil işlemini tamamlayın

### Nakil Sonuçları

- Nakil durumu (Beklemede, Tamamlandı, Hata)
- SGK referans kodu
- Hata kodu ve açıklaması

## Dönem Hesaplama

### Dönem Bilgisi Hesaplama

1. **Dönem Hesaplama** bölümünde **Dönem Hesapla** butonuna tıklayın
2. Dönem bilgilerini girin:
   - **Dönem Türü**: Bulunduğumuz veya Önceki
   - **Belge Türü**: Belge türü kodu
   - **Hakedilen Ücret**: Hakedilen ücret tutarı
   - **Prim İkramiye**: Prim ve ikramiye tutarı
   - **Eksik Gün Sayısı**: Eksik gün sayısı
   - **Eksik Gün Nedeni**: Eksik gün nedeni kodu

### Dönem Hesaplama Sonuçları

- Dönem başlangıç ve bitiş tarihleri
- Dönem gün sayısı
- Hesaplama tarihi
- SGK referans kodu

## Test Ortamı

### Test Ortamı Oluşturma

1. **Test Ortamı** bölümünde **Yeni Test Ortamı** butonuna tıklayın
2. Test ortamı bilgilerini girin:
   - **Ortam Adı**: Test ortamı adı
   - **Ortam Tipi**: Test, Demo, Staging, Production
   - **SGK URL**: Test ortamı URL'i
   - **Test İşyeri Kodu**: Test işyeri kodu
   - **Test İşyeri Sicil**: Test işyeri sicil
   - **Test Kullanıcı Adı**: Test kullanıcı adı
   - **Test Şifre**: Test şifresi
   - **Test Sistem Şifre**: Test sistem şifresi

### Test Çalıştırma

1. Oluşturulan test ortamını seçin
2. **Test Çalıştır** butonuna tıklayın
3. Test sonuçlarını kontrol edin

### Test Sonuçları

- Test durumu (Beklemede, Çalışıyor, Başarılı, Başarısız)
- Test sonucu
- Test hata mesajı
- Test detayları

## SOAP Client Yönetimi

### SOAP Client Oluşturma

1. **SOAP Client** bölümünde **Yeni SOAP Client** butonuna tıklayın
2. SOAP client bilgilerini girin:
   - **Client Adı**: SOAP client adı
   - **SOAP Endpoint**: SOAP endpoint URL'i
   - **WSDL URL**: WSDL dosya URL'i
   - **Timeout**: Timeout süresi (milisaniye)
   - **Retry Count**: Yeniden deneme sayısı

### SOAP Bağlantı Testi

1. Oluşturulan SOAP client'ı seçin
2. **Bağlantı Testi** butonuna tıklayın
3. Test sonuçlarını kontrol edin

### SOAP Client Sonuçları

- Bağlantı durumu (Aktif, Pasif, Hata)
- Son bağlantı tarihi
- Hata mesajı

## Güvenlik ve Şifreleme

### Güvenlik Ayarları

1. **Güvenlik Ayarları** bölümünde **Yeni Güvenlik Ayarı** butonuna tıklayın
2. Güvenlik ayarlarını girin:
   - **Şifreleme Algoritması**: AES-256, AES-128
   - **Hash Algoritması**: SHA-256, SHA-512, MD5
   - **Token Süresi**: Token geçerlilik süresi
   - **Maksimum Deneme Sayısı**: Maksimum deneme sayısı
   - **Kilitlenme Süresi**: Kilitlenme süresi
   - **IP Kısıtlaması**: IP kısıtlaması ayarları

### Şifreleme Testi

1. Güvenlik ayarlarını kaydedin
2. **Şifreleme Testi** butonuna tıklayın
3. Test sonuçlarını kontrol edin

### Güvenlik Özellikleri

- Veri şifreleme (AES-CBC)
- Hash oluşturma (SHA-256/SHA-512/MD5)
- Token yönetimi
- IP kısıtlaması
- Deneme sayısı sınırlaması

## İşlem Loglama ve Denetim

### İşlem Logları

Tüm SGK işlemleri otomatik olarak loglanır:

- İşlem tipi ve detayı
- İşlem parametreleri
- İşlem sonucu
- SGK hata kodu ve açıklaması
- İşlem süresi ve boyutu
- Kullanıcı bilgileri
- IP adresi ve user agent

### Log Filtreleme

1. **İşlem Logları** bölümünde filtreleme seçeneklerini kullanın
2. Tarih aralığı, işlem tipi, kullanıcı gibi kriterlere göre filtreleyin
3. Sonuçları görüntüleyin

### Log Detayları

- İşlem detayları
- Parametreler (JSON formatında)
- Sonuçlar (JSON formatında)
- SGK yanıt verisi
- Hata detayları

### Log Export

- CSV formatında export
- Excel formatında export
- Belirli tarih aralığında export

## Bildirim Sistemi

### Bildirim Türleri

- **Başarı**: İşlem başarıyla tamamlandı
- **Hata**: İşlem sırasında hata oluştu
- **Uyarı**: Dikkat edilmesi gereken durum
- **Bilgi**: Genel bilgilendirme

### Bildirim Kategorileri

- **İşe Giriş**: İşe giriş işlemleri
- **İşten Çıkış**: İşten çıkış işlemleri
- **Sorgulama**: Sorgulama işlemleri
- **PDF**: PDF oluşturma işlemleri
- **Nakil**: Nakil işlemleri
- **Dönem**: Dönem hesaplama işlemleri
- **Test**: Test işlemleri
- **Güvenlik**: Güvenlik işlemleri

### Bildirim Öncelikleri

- **Düşük**: Genel bilgilendirme
- **Orta**: Önemli durumlar
- **Yüksek**: Kritik durumlar
- **Acil**: Acil müdahale gereken durumlar

### Bildirim Ayarları

- Email bildirimleri
- SMS bildirimleri
- Push bildirimleri
- Ses bildirimleri

## Raporlama ve Analiz

### Genel Analiz

- Sigorta türü dağılımı
- Meslek kodu dağılımı
- Çıkış nedeni dağılımı
- İşlem tipi dağılımı
- Hata kodu dağılımı
- Ortalama işlem süresi

### Rapor Oluşturma

1. **Raporlama** bölümünde **Yeni Rapor** butonuna tıklayın
2. Rapor bilgilerini girin:
   - **Rapor Adı**: Rapor adı
   - **Rapor Tipi**: Rapor türü
   - **Başlangıç Tarihi**: Rapor başlangıç tarihi
   - **Bitiş Tarihi**: Rapor bitiş tarihi
3. Rapor parametrelerini ayarlayın
4. Rapor oluşturma işlemini başlatın

### Rapor Türleri

- **İşe Giriş**: İşe giriş raporları
- **İşten Çıkış**: İşten çıkış raporları
- **Sorgulama**: Sorgulama raporları
- **PDF**: PDF raporları
- **Nakil**: Nakil raporları
- **Dönem**: Dönem raporları
- **Test**: Test raporları
- **Güvenlik**: Güvenlik raporları
- **Genel**: Genel raporlar

### Rapor Export

- Excel formatında export
- PDF formatında export
- CSV formatında export

## Entegrasyon Testleri

### Test Suite Çalıştırma

1. **Entegrasyon Testleri** bölümünde **Tam Test Suite Çalıştır** butonuna tıklayın
2. Test suite otomatik olarak çalışır
3. Test sonuçlarını kontrol edin

### Tekil Testler

- **Bağlantı Testi**: SGK bağlantısını test eder
- **Kimlik Doğrulama**: Kimlik doğrulama işlemini test eder
- **İşe Giriş Testi**: İşe giriş işlemini test eder
- **İşten Çıkış Testi**: İşten çıkış işlemini test eder
- **Sorgulama Testi**: Sorgulama işlemini test eder
- **PDF Testi**: PDF oluşturma işlemini test eder
- **Nakil Testi**: Nakil işlemini test eder
- **Dönem Testi**: Dönem hesaplama işlemini test eder
- **Güvenlik Testi**: Güvenlik işlemlerini test eder
- **Performans Testi**: Performans testlerini çalıştırır

### Test Sonuçları

- Test durumu (Beklemede, Çalışıyor, Başarılı, Başarısız)
- Test sonucu
- Test hata mesajı
- Test detayları
- Test parametreleri
- Test logları

## Hata Yönetimi

### Hata Türleri

- **Bağlantı Hataları**: SGK servislerine bağlantı sorunları
- **Kimlik Doğrulama Hataları**: Kullanıcı adı/şifre hataları
- **Veri Doğrulama Hataları**: Girdi verilerinin hatalı olması
- **SGK Hataları**: SGK servislerinden dönen hatalar
- **Sistem Hataları**: Sistem içi hatalar

### Hata Kodları

SGK'dan dönen hata kodları ve açıklamaları:

- **0000**: İşlem başarılı
- **1001**: Geçersiz kullanıcı adı/şifre
- **1002**: Geçersiz işyeri sicil
- **1003**: Geçersiz TC kimlik numarası
- **1004**: Geçersiz tarih formatı
- **1005**: Eksik parametre
- **2001**: SGK servis hatası
- **2002**: Timeout hatası
- **2003**: Bağlantı hatası

### Hata Çözümleri

- **Bağlantı Hataları**: İnternet bağlantısını kontrol edin
- **Kimlik Doğrulama Hataları**: SGK kimlik bilgilerini kontrol edin
- **Veri Doğrulama Hataları**: Girdi verilerini kontrol edin
- **SGK Hataları**: SGK hata kodlarını kontrol edin
- **Sistem Hataları**: Sistem yöneticisi ile iletişime geçin

## Sık Sorulan Sorular

### S: SGK entegrasyonu nasıl çalışır?

C: SGK entegrasyonu, SGK'nın web servisleri üzerinden SOAP protokolü ile çalışır. Personel bilgileri SGK'ya gönderilir ve işlem sonuçları alınır.

### S: Test modu nedir?

C: Test modu, gerçek SGK servisleri yerine test servislerini kullanır. Bu sayede gerçek veriler etkilenmeden test işlemleri yapabilirsiniz.

### S: Toplu işlemlerde kaç personel işlenebilir?

C: Toplu işlemlerde maksimum 10 personel işlenebilir. Bu SGK'nın web servis limitlerinden kaynaklanır.

### S: PDF dokümanları nerede saklanır?

C: PDF dokümanları veritabanında BYTEA formatında saklanır. Bu sayede dokümanlar güvenli bir şekilde korunur.

### S: Hata logları ne kadar süre saklanır?

C: Hata logları varsayılan olarak 1 yıl saklanır. Bu süre sistem yöneticisi tarafından ayarlanabilir.

### S: Nakil işlemleri nasıl çalışır?

C: Nakil işlemleri, aynı işverenin farklı işyerileri arasında personel transferi için kullanılır. Önce eski işyerinden çıkış, sonra yeni işyerine giriş işlemi yapılır.

## Teknik Destek

### Destek Kanalları

- **Email**: support@yasansafe.com
- **Telefon**: +90 (212) 555-0123
- **WhatsApp**: +90 (212) 555-0123
- **Ticket Sistemi**: https://support.yasansafe.com

### Destek Saatleri

- **Pazartesi - Cuma**: 09:00 - 18:00
- **Cumartesi**: 09:00 - 13:00
- **Pazar**: Kapalı

### Acil Durumlar

Acil durumlar için 7/24 destek hattı:

- **Telefon**: +90 (212) 555-0124
- **Email**: emergency@yasansafe.com

### Dokümantasyon Güncellemeleri

Bu dokümantasyon düzenli olarak güncellenir. En güncel versiyonu için:

- **Website**: https://docs.yasansafe.com/sgk
- **GitHub**: https://github.com/yasansafe/sgk-docs

---

**Son Güncelleme**: 2024-01-15  
**Versiyon**: 1.0.0  
**Yazan**: YasanSafe Teknik Ekibi
