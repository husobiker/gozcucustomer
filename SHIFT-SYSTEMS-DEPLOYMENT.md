# Vardiya Sistemleri Kurulum Rehberi

## 🚨 Sorun

Vardiya sistemleri yüklenemiyor - 404 hatası alınıyor:

- `create_8_hour_3_shift_system` fonksiyonu bulunamıyor
- `create_12_36_shift_system` fonksiyonu bulunamıyor

## ✅ Çözüm

### 1. Supabase'e Giriş Yap

- https://supabase.com adresine git
- Projene giriş yap: `wxxnpgevlncxvpbakrnx`

### 2. SQL Editor'ı Aç

- Sol menüden "SQL Editor" seç
- "New Query" butonuna tıkla

### 3. Vardiya Sistemleri SQL'ini Yükle

`create-shift-systems-table.sql` dosyasının içeriğini kopyala ve SQL Editor'da çalıştır.

### 4. SQL'i Çalıştır

- "Run" butonuna tıkla
- Başarılı olursa "Success" mesajı göreceksin

### 5. Test Et

- Admin panelini yenile: http://localhost:3000
- Vardiya sistemi oluşturmayı dene
- Console'da hata olmamalı

## 🔧 Alternatif: Otomatik Kurulum

Eğer `exec_sql` fonksiyonu mevcutsa, otomatik kurulum scripti kullanılabilir:

```bash
cd admin-panel
node deploy-shift-systems.js
```

## 📋 Kontrol Listesi

Kurulum başarılı olduğunda şunlar olmalı:

1. **Tablolar Oluştu**:

   - `shift_systems` tablosu
   - `shift_details` tablosu

2. **Fonksiyonlar**:

   - `create_8_hour_3_shift_system`
   - `create_12_hour_2_shift_system`
   - `create_12_36_shift_system`
   - `get_shift_system_info`

3. **Test**:
   - Vardiya sistemi oluşturma çalışıyor
   - 404 hatası yok

## 🚨 Sorun Giderme

### "Function not found" Hatası

- SQL'i tekrar çalıştır
- Supabase'de "Functions" sekmesinde fonksiyonları kontrol et

### "Table not found" Hatası

- SQL'i tekrar çalıştır
- Supabase'de "Table Editor"da tabloları kontrol et

### RLS Hatası

- `temporarily-disable-rls.sql` dosyasını çalıştır
- Vardiya sistemlerini oluştur
- RLS'yi tekrar aktif et

## 📞 Destek

Sorun devam ederse:

1. Supabase SQL Editor'da hata mesajlarını kontrol et
2. Browser console'da detaylı hata loglarını incele
3. `create-shift-systems-table.sql` dosyasını manuel olarak çalıştır
