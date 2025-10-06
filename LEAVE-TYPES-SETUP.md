# İzin Türleri (Leave Types) Kurulum Rehberi

Bu rehber, vardiya takvimine izin türlerini nasıl ekleyeceğinizi açıklar.

## 1. Veritabanı Güncellemeleri

### Adım 1: İzin Türü Alanlarını Ekle

```sql
-- Supabase SQL Editor'da çalıştırın
-- Dosya: add-leave-type-fields.sql
```

### Adım 2: Örnek İzin Türlerini Ekle

```sql
-- Supabase SQL Editor'da çalıştırın
-- Dosya: add-leave-types.sql
```

## 2. Eklenen İzin Türleri

### ÜCRETSİZ (Unpaid) İzinler

- **MAZERET İZNİ (MI)** - Turuncu (#FF9800)
- **ÜCRETSİZ İZİN (Öİ)** - Açık turuncu (#FFB74D)
- **MAZERETSİZ GELMEMEZLİK (MG)** - Sarı (#FFEB3B)
- **DOKTOR RAPORU (DR)** - Açık turuncu (#FFB74D)

### ÜCRETLİ (Paid) İzinler

- **YILLIK İZİN (Yİ)** - Yeşil (#4CAF50)
- **EVLİLİK İZNİ (Eİ)** - Pembe (#E91E63)
- **ÖLÜM İZNİ (Öİ)** - Açık turuncu (#FFB74D)
- **DOĞUM İZNİ (Dİ)** - Açık mavi (#81C784)
- **BAYRAM TATİLİ (BT)** - Turuncu (#FF9800)
- **DIŞ GÖREV (DG)** - Açık yeşil (#A5D6A7)
- **HAFTA TATİLİ (HT)** - Koyu gri (#616161)
- **MESAİ (M)** - Turuncu (#FF9800)

## 3. Özellikler

### Vardiya Tipleri Sayfasında

- İzin türleri kategorilere ayrılır (Ücretli İzin, Ücretsiz İzin, Çalışma Vardiyası)
- Her kategori farklı renk kodları ile gösterilir
- İzin türleri için saat bilgisi gösterilmez (00:00 - 00:00)

### Vardiya Takviminde

- İzin türleri sadece isim olarak görünür (saat aralığı değil)
- Renk kodları korunur
- Ücretli/ücretsiz durumu chip'lerde gösterilir

## 4. Yeni İzin Türü Ekleme

1. **Vardiya Tipleri** sayfasına gidin
2. **"Yeni Vardiya Tipi"** butonuna tıklayın
3. Form'da:
   - **İzin Türü** switch'ini açın
   - **Ücretli İzin** switch'ini açın/kapatın (isteğe bağlı)
   - Diğer bilgileri doldurun
4. **"Oluştur"** butonuna tıklayın

## 5. Kullanım

İzin türleri artık vardiya takviminde kullanılabilir:

- Personel için izin günleri atanabilir
- Joker personel için izin günleri atanabilir
- İzin türleri otomatik olarak hafta sonları için uygulanabilir

## 6. Teknik Detaylar

### Veritabanı Alanları

- `is_leave_type`: İzin türü mü? (boolean)
- `is_paid_leave`: Ücretli izin mi? (boolean)
- `category`: Kategori ('work', 'unpaid_leave', 'paid_leave', 'holiday')

### UI Güncellemeleri

- ShiftTypes.tsx: Kategori gösterimi ve form alanları
- DutySchedules.tsx: İzin türleri için saat bilgisi gizleme
- Renk kodları ve chip'ler güncellendi


