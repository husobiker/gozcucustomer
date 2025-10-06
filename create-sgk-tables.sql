-- =====================================================
-- SGK İşlemleri için KAPSAMLI Veritabanı Tabloları
-- 4A Sigortalı İşe Giriş - İşten Ayrılış TAM ENTEGRASYON
-- Belgedeki TÜM alanlar ve parametreler dahil
-- =====================================================

-- Mevcut tabloları güncelle (eğer varsa)
-- SGK Kimlik Bilgileri tablosuna yeni sütunlar ekle
ALTER TABLE sgk_credentials ADD COLUMN IF NOT EXISTS is_test_mode BOOLEAN DEFAULT FALSE;
ALTER TABLE sgk_credentials ADD COLUMN IF NOT EXISTS test_isyeri_kodu VARCHAR(10);
ALTER TABLE sgk_credentials ADD COLUMN IF NOT EXISTS sistem_sifre VARCHAR(255);
ALTER TABLE sgk_credentials ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE sgk_credentials ADD COLUMN IF NOT EXISTS failed_attempts INTEGER DEFAULT 0;
ALTER TABLE sgk_credentials ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE;

-- SGK İşe Giriş tablosuna yeni sütunlar ekle
ALTER TABLE sgk_ise_giris_kayitlari ADD COLUMN IF NOT EXISTS ad VARCHAR(18);
ALTER TABLE sgk_ise_giris_kayitlari ADD COLUMN IF NOT EXISTS soyad VARCHAR(18);
ALTER TABLE sgk_ise_giris_kayitlari ADD COLUMN IF NOT EXISTS sigorta_turu INTEGER DEFAULT 0;
ALTER TABLE sgk_ise_giris_kayitlari ADD COLUMN IF NOT EXISTS istisna_kodu VARCHAR(1);
ALTER TABLE sgk_ise_giris_kayitlari ADD COLUMN IF NOT EXISTS gorevkodu VARCHAR(2);
ALTER TABLE sgk_ise_giris_kayitlari ADD COLUMN IF NOT EXISTS meslekkodu VARCHAR(8);
ALTER TABLE sgk_ise_giris_kayitlari ADD COLUMN IF NOT EXISTS csgbiskolu VARCHAR(2);
ALTER TABLE sgk_ise_giris_kayitlari ADD COLUMN IF NOT EXISTS eskihukumlu VARCHAR(1) DEFAULT 'H';
ALTER TABLE sgk_ise_giris_kayitlari ADD COLUMN IF NOT EXISTS ozurlu VARCHAR(1) DEFAULT 'H';
ALTER TABLE sgk_ise_giris_kayitlari ADD COLUMN IF NOT EXISTS ogrenimkodu VARCHAR(1);
ALTER TABLE sgk_ise_giris_kayitlari ADD COLUMN IF NOT EXISTS mezuniyetbolumu VARCHAR(100);
ALTER TABLE sgk_ise_giris_kayitlari ADD COLUMN IF NOT EXISTS mezuniyetyili INTEGER;
ALTER TABLE sgk_ise_giris_kayitlari ADD COLUMN IF NOT EXISTS kismi_sureli_calisiyormu VARCHAR(1) DEFAULT 'H';
ALTER TABLE sgk_ise_giris_kayitlari ADD COLUMN IF NOT EXISTS kismi_sureli_calisma_gun_sayisi INTEGER;
ALTER TABLE sgk_ise_giris_kayitlari ADD COLUMN IF NOT EXISTS ayni_isveren_farkli_isyeri_nakil VARCHAR(1) DEFAULT 'H';
ALTER TABLE sgk_ise_giris_kayitlari ADD COLUMN IF NOT EXISTS nakil_geldigi_isyeri_sicil VARCHAR(26);
ALTER TABLE sgk_ise_giris_kayitlari ADD COLUMN IF NOT EXISTS sgk_referans_kodu BIGINT;
ALTER TABLE sgk_ise_giris_kayitlari ADD COLUMN IF NOT EXISTS sgk_sicil_no BIGINT;
ALTER TABLE sgk_ise_giris_kayitlari ADD COLUMN IF NOT EXISTS sgk_islem_sonucu INTEGER;
ALTER TABLE sgk_ise_giris_kayitlari ADD COLUMN IF NOT EXISTS sgk_islem_aciklamasi TEXT;
ALTER TABLE sgk_ise_giris_kayitlari ADD COLUMN IF NOT EXISTS pdf_dosya_boyutu BIGINT;
ALTER TABLE sgk_ise_giris_kayitlari ADD COLUMN IF NOT EXISTS idari_para_cezasi DECIMAL(10,2) DEFAULT 0;

-- SGK İşten Çıkış tablosuna yeni sütunlar ekle
ALTER TABLE sgk_isten_cikis_kayitlari ADD COLUMN IF NOT EXISTS ad VARCHAR(18);
ALTER TABLE sgk_isten_cikis_kayitlari ADD COLUMN IF NOT EXISTS soyad VARCHAR(18);
ALTER TABLE sgk_isten_cikis_kayitlari ADD COLUMN IF NOT EXISTS isten_cikis_nedeni VARCHAR(2);
ALTER TABLE sgk_isten_cikis_kayitlari ADD COLUMN IF NOT EXISTS meslekkodu VARCHAR(8);
ALTER TABLE sgk_isten_cikis_kayitlari ADD COLUMN IF NOT EXISTS csgbiskolu VARCHAR(2);
ALTER TABLE sgk_isten_cikis_kayitlari ADD COLUMN IF NOT EXISTS nakil_gidecegi_isyeri_sicil VARCHAR(26);
ALTER TABLE sgk_isten_cikis_kayitlari ADD COLUMN IF NOT EXISTS sgk_referans_kodu BIGINT;
ALTER TABLE sgk_isten_cikis_kayitlari ADD COLUMN IF NOT EXISTS sgk_sicil_no BIGINT;
ALTER TABLE sgk_isten_cikis_kayitlari ADD COLUMN IF NOT EXISTS sgk_islem_sonucu INTEGER;
ALTER TABLE sgk_isten_cikis_kayitlari ADD COLUMN IF NOT EXISTS sgk_islem_aciklamasi TEXT;
ALTER TABLE sgk_isten_cikis_kayitlari ADD COLUMN IF NOT EXISTS pdf_dosya_boyutu BIGINT;
ALTER TABLE sgk_isten_cikis_kayitlari ADD COLUMN IF NOT EXISTS idari_para_cezasi DECIMAL(10,2) DEFAULT 0;

-- SGK PDF Dokümanları tablosuna yeni sütunlar ekle
ALTER TABLE sgk_pdf_dokumanlari ADD COLUMN IF NOT EXISTS sgk_ise_giris_id UUID REFERENCES sgk_ise_giris_kayitlari(id) ON DELETE CASCADE;
ALTER TABLE sgk_pdf_dokumanlari ADD COLUMN IF NOT EXISTS sgk_isten_cikis_id UUID REFERENCES sgk_isten_cikis_kayitlari(id) ON DELETE CASCADE;
ALTER TABLE sgk_pdf_dokumanlari ADD COLUMN IF NOT EXISTS dosya_hash VARCHAR(64);
ALTER TABLE sgk_pdf_dokumanlari ADD COLUMN IF NOT EXISTS dosya_mime_type VARCHAR(100) DEFAULT 'application/pdf';
ALTER TABLE sgk_pdf_dokumanlari ADD COLUMN IF NOT EXISTS pdf_byte_array BYTEA;
ALTER TABLE sgk_pdf_dokumanlari ADD COLUMN IF NOT EXISTS pdf_sayfa_sayisi INTEGER;
ALTER TABLE sgk_pdf_dokumanlari ADD COLUMN IF NOT EXISTS pdf_olusturma_tarihi TIMESTAMP WITH TIME ZONE;
ALTER TABLE sgk_pdf_dokumanlari ADD COLUMN IF NOT EXISTS sgk_indirme_tarihi TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE sgk_pdf_dokumanlari ADD COLUMN IF NOT EXISTS indirme_sayisi INTEGER DEFAULT 0;
ALTER TABLE sgk_pdf_dokumanlari ADD COLUMN IF NOT EXISTS son_indirme_tarihi TIMESTAMP WITH TIME ZONE;
ALTER TABLE sgk_pdf_dokumanlari ADD COLUMN IF NOT EXISTS indiren_kullanici_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- SGK İşlem Geçmişi tablosuna yeni sütunlar ekle
ALTER TABLE sgk_islem_gecmisi ADD COLUMN IF NOT EXISTS islem_parametreleri JSONB;
ALTER TABLE sgk_islem_gecmisi ADD COLUMN IF NOT EXISTS islem_sonucu JSONB;
ALTER TABLE sgk_islem_gecmisi ADD COLUMN IF NOT EXISTS islem_boyutu_bytes INTEGER;
ALTER TABLE sgk_islem_gecmisi ADD COLUMN IF NOT EXISTS basarili_mi BOOLEAN DEFAULT FALSE;
ALTER TABLE sgk_islem_gecmisi ADD COLUMN IF NOT EXISTS hata_detayi TEXT;
ALTER TABLE sgk_islem_gecmisi ADD COLUMN IF NOT EXISTS kullanici_ip INET;

-- SGK Kimlik Bilgileri Tablosu (Geliştirilmiş)
CREATE TABLE IF NOT EXISTS sgk_credentials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- SGK Kimlik Bilgileri
  kullanici_adi VARCHAR(255) NOT NULL,
  sifre VARCHAR(255) NOT NULL,
  isyeri_sicil VARCHAR(26) NOT NULL, -- 26 haneli işyeri sicil
  
  -- Test/Production Ortam Bilgileri
  is_test_mode BOOLEAN DEFAULT FALSE,
  test_isyeri_kodu VARCHAR(10), -- Test işyeri kodu
  sistem_sifre VARCHAR(255), -- Sistem şifresi
  
  -- Durum ve Güvenlik
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMP WITH TIME ZONE,
  failed_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(tenant_id) -- Her tenant için tek SGK kimlik bilgisi
);

-- SGK İşe Giriş Kayıtları Tablosu (TAM PARAMETRELER)
CREATE TABLE IF NOT EXISTS sgk_ise_giris_kayitlari (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  personnel_id UUID NOT NULL REFERENCES personnel(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Temel SGK Bilgileri
  tckimlik_no VARCHAR(11) NOT NULL,
  ad VARCHAR(18) NOT NULL, -- Sigortalının adı
  soyad VARCHAR(18) NOT NULL, -- Sigortalının soyadı
  giris_tarihi DATE NOT NULL,
  sigorta_turu INTEGER NOT NULL DEFAULT 0, -- Sigorta kolu (0-37)
  
  -- Detaylı Bilgiler
  gorevkodu VARCHAR(2), -- Görev kodu (01-06)
  meslekkodu VARCHAR(8), -- İşkur meslek kodu (9999.99 formatında)
  csgbiskolu VARCHAR(2), -- ÇSGB iş kolu (01-20)
  
  -- Kişisel Bilgiler
  eskihukumlu VARCHAR(1) DEFAULT 'H' CHECK (eskihukumlu IN ('E', 'H')), -- Eski hükümlü
  ozurlu VARCHAR(1) DEFAULT 'H' CHECK (ozurlu IN ('E', 'H')), -- Engelli
  ogrenimkodu VARCHAR(1), -- Öğrenim kodu (0-7)
  mezuniyetbolumu VARCHAR(100), -- Mezuniyet bölümü
  mezuniyetyili INTEGER, -- Mezuniyet yılı
  
  -- Çalışma Bilgileri
  kismi_sureli_calisiyormu VARCHAR(1) DEFAULT 'H' CHECK (kismi_sureli_calisiyormu IN ('E', 'H')),
  kismi_sureli_calisma_gun_sayisi INTEGER CHECK (kismi_sureli_calisma_gun_sayisi >= 1 AND kismi_sureli_calisma_gun_sayisi <= 29),
  
  -- Nakil Bilgileri
  ayni_isveren_farkli_isyeri_nakil VARCHAR(1) DEFAULT 'H' CHECK (ayni_isveren_farkli_isyeri_nakil IN ('E', 'H')),
  nakil_geldigi_isyeri_sicil VARCHAR(26), -- Nakil geldiği işyeri sicil
  
  -- SGK Referans Bilgileri
  sgk_referans_kodu BIGINT, -- SGK'dan dönen referans kodu
  sgk_sicil_no BIGINT, -- SGK'dan dönen sicil numarası
  sgk_islem_tarihi TIMESTAMP WITH TIME ZONE,
  sgk_hatakodu INTEGER,
  sgk_hata_aciklama TEXT,
  sgk_islem_sonucu INTEGER, -- 0, -1, -101
  sgk_islem_aciklamasi TEXT,
  
  -- Durum Bilgileri
  durum VARCHAR(20) DEFAULT 'beklemede' CHECK (durum IN ('beklemede', 'gonderildi', 'basarili', 'hatali', 'iptal')),
  pdf_dosya_path TEXT, -- PDF dosyasının yolu
  pdf_dosya_boyutu BIGINT, -- PDF dosya boyutu
  
  -- Ek Bilgiler
  notlar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(personnel_id, giris_tarihi) -- Aynı personel için aynı tarihte tek kayıt
);

-- SGK İşten Çıkış Kayıtları Tablosu (TAM PARAMETRELER)
CREATE TABLE IF NOT EXISTS sgk_isten_cikis_kayitlari (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  personnel_id UUID NOT NULL REFERENCES personnel(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Temel SGK Bilgileri
  tckimlik_no VARCHAR(11) NOT NULL,
  ad VARCHAR(18) NOT NULL, -- Sigortalının adı
  soyad VARCHAR(18) NOT NULL, -- Sigortalının soyadı
  cikis_tarihi DATE NOT NULL,
  isten_cikis_nedeni VARCHAR(2) NOT NULL, -- İşten çıkış nedeni (01-37)
  
  -- Detaylı Bilgiler
  meslekkodu VARCHAR(8), -- İşkur meslek kodu (9999.99 formatında)
  csgbiskolu VARCHAR(2), -- ÇSGB iş kolu (01-20)
  
  -- Nakil Bilgileri
  nakil_gidecegi_isyeri_sicil VARCHAR(26), -- Nakil gideceği işyeri sicil
  
  -- SGK Referans Bilgileri
  sgk_referans_kodu BIGINT, -- SGK'dan dönen referans kodu
  sgk_sicil_no BIGINT, -- SGK'dan dönen sicil numarası
  sgk_islem_tarihi TIMESTAMP WITH TIME ZONE,
  sgk_hatakodu INTEGER,
  sgk_hata_aciklama TEXT,
  sgk_islem_sonucu INTEGER, -- 0, -1, -101
  sgk_islem_aciklamasi TEXT,
  
  -- Durum Bilgileri
  durum VARCHAR(20) DEFAULT 'beklemede' CHECK (durum IN ('beklemede', 'gonderildi', 'basarili', 'hatali', 'iptal')),
  pdf_dosya_path TEXT, -- PDF dosyasının yolu
  pdf_dosya_boyutu BIGINT, -- PDF dosya boyutu
  
  -- Ek Bilgiler
  notlar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(personnel_id, cikis_tarihi) -- Aynı personel için aynı tarihte tek kayıt
);

-- SGK Dönem Bilgileri Tablosu (Bulunduğumuz ve Önceki Dönem)
CREATE TABLE IF NOT EXISTS sgk_donem_bilgileri (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sgk_isten_cikis_id UUID NOT NULL REFERENCES sgk_isten_cikis_kayitlari(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Dönem Türü
  donem_turu VARCHAR(20) NOT NULL CHECK (donem_turu IN ('bulundugumuz', 'onceki')),
  
  -- Belge Bilgileri
  belge_turu VARCHAR(2) NOT NULL, -- Belge türü (01-51)
  hakedilen_ucret DECIMAL(15,2) NOT NULL, -- Hakedilen ücret
  prim_ikramiye DECIMAL(15,2), -- Prim ikramiye tutarı
  
  -- Eksik Gün Bilgileri
  eksik_gun_sayisi INTEGER CHECK (eksik_gun_sayisi >= 1 AND eksik_gun_sayisi <= 31),
  eksik_gun_nedeni VARCHAR(2), -- Eksik gün nedeni (00-24)
  
  -- Dönem Tarihleri (SGK'dan gelen bilgiler)
  donem_baslangic_tarihi DATE,
  donem_bitis_tarihi DATE,
  donem_gun_sayisi INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SGK Sorgulama Geçmişi Tablosu
CREATE TABLE IF NOT EXISTS sgk_sorgulama_gecmisi (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Sorgulama Bilgileri
  sorgulama_tipi VARCHAR(30) NOT NULL CHECK (sorgulama_tipi IN ('tc_ile_ise_giris', 'tc_ile_isten_cikis', 'tc_tarih_ile_ise_giris', 'tc_tarih_ile_isten_cikis', 'donem_gun_sayisi')),
  tckimlik_no VARCHAR(11) NOT NULL,
  sorgulama_tarihi DATE,
  
  -- SGK Yanıt Bilgileri
  sgk_hatakodu INTEGER,
  sgk_hata_aciklama TEXT,
  sgk_yanit_data JSONB, -- SGK'dan dönen tam yanıt
  
  -- Bulunan Kayıtlar
  bulunan_kayit_sayisi INTEGER DEFAULT 0,
  
  -- İşlem Bilgileri
  islem_tarihi TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  islem_suresi_ms INTEGER, -- İşlem süresi milisaniye cinsinden
  
  -- Kullanıcı Bilgileri
  kullanici_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SGK İşlem Geçmişi Tablosu (Geliştirilmiş)
CREATE TABLE IF NOT EXISTS sgk_islem_gecmisi (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- İşlem Bilgileri
  islem_tipi VARCHAR(30) NOT NULL CHECK (islem_tipi IN ('ise_giris', 'isten_cikis', 'tc_sorgulama', 'tc_tarih_sorgulama', 'donem_hesaplama', 'pdf_indirme', 'toplu_islem')),
  islem_detay TEXT,
  
  -- İşlem Parametreleri
  islem_parametreleri JSONB, -- Gönderilen parametreler
  islem_sonucu JSONB, -- Dönen sonuç
  
  -- SGK Yanıt Bilgileri
  sgk_hatakodu INTEGER,
  sgk_hata_aciklama TEXT,
  sgk_yanit_data JSONB, -- SGK'dan dönen tam yanıt
  
  -- İşlem İstatistikleri
  islem_tarihi TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  islem_suresi_ms INTEGER, -- İşlem süresi milisaniye cinsinden
  islem_boyutu_bytes INTEGER, -- Gönderilen veri boyutu
  
  -- Başarı/Hata Bilgileri
  basarili_mi BOOLEAN DEFAULT FALSE,
  hata_detayi TEXT,
  
  -- Kullanıcı Bilgileri
  kullanici_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  kullanici_ip INET, -- Kullanıcı IP adresi
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SGK PDF Dokümanları Tablosu (Geliştirilmiş)
CREATE TABLE IF NOT EXISTS sgk_pdf_dokumanlari (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Referans Bilgileri
  referans_kodu BIGINT NOT NULL,
  dokuman_tipi VARCHAR(20) NOT NULL CHECK (dokuman_tipi IN ('ise_giris', 'isten_cikis')),
  
  -- İlişkili Kayıtlar
  sgk_ise_giris_id UUID REFERENCES sgk_ise_giris_kayitlari(id) ON DELETE CASCADE,
  sgk_isten_cikis_id UUID REFERENCES sgk_isten_cikis_kayitlari(id) ON DELETE CASCADE,
  
  -- Dosya Bilgileri
  dosya_adi VARCHAR(255) NOT NULL,
  dosya_boyutu BIGINT,
  dosya_path TEXT NOT NULL,
  dosya_hash VARCHAR(64), -- Dosya bütünlüğü için hash
  dosya_mime_type VARCHAR(100) DEFAULT 'application/pdf',
  
  -- PDF İçerik Bilgileri
  pdf_byte_array BYTEA, -- PDF byte array (isteğe bağlı saklama)
  pdf_sayfa_sayisi INTEGER,
  pdf_olusturma_tarihi TIMESTAMP WITH TIME ZONE,
  
  -- SGK Bilgileri
  sgk_hatakodu INTEGER,
  sgk_hata_aciklama TEXT,
  sgk_indirme_tarihi TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Durum Bilgileri
  durum VARCHAR(20) DEFAULT 'indirildi' CHECK (durum IN ('indirildi', 'hata', 'silindi')),
  indirme_sayisi INTEGER DEFAULT 0,
  son_indirme_tarihi TIMESTAMP WITH TIME ZONE,
  
  -- Kullanıcı Bilgileri
  indiren_kullanici_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Politikaları
ALTER TABLE sgk_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE sgk_ise_giris_kayitlari ENABLE ROW LEVEL SECURITY;
ALTER TABLE sgk_isten_cikis_kayitlari ENABLE ROW LEVEL SECURITY;
ALTER TABLE sgk_donem_bilgileri ENABLE ROW LEVEL SECURITY;
ALTER TABLE sgk_sorgulama_gecmisi ENABLE ROW LEVEL SECURITY;
ALTER TABLE sgk_islem_gecmisi ENABLE ROW LEVEL SECURITY;
ALTER TABLE sgk_pdf_dokumanlari ENABLE ROW LEVEL SECURITY;

-- SGK Kimlik Bilgileri RLS Politikası
DROP POLICY IF EXISTS "sgk_credentials_tenant_policy" ON sgk_credentials;
CREATE POLICY "sgk_credentials_tenant_policy" ON sgk_credentials
  FOR ALL USING (
    auth.jwt() ->> 'tenant_id' IS NOT NULL AND
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  ) WITH CHECK (
    auth.jwt() ->> 'tenant_id' IS NOT NULL AND
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

-- SGK İşe Giriş Kayıtları RLS Politikası
DROP POLICY IF EXISTS "sgk_ise_giris_kayitlari_tenant_policy" ON sgk_ise_giris_kayitlari;
CREATE POLICY "sgk_ise_giris_kayitlari_tenant_policy" ON sgk_ise_giris_kayitlari
  FOR ALL USING (
    auth.jwt() ->> 'tenant_id' IS NOT NULL AND
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  ) WITH CHECK (
    auth.jwt() ->> 'tenant_id' IS NOT NULL AND
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

-- SGK İşten Çıkış Kayıtları RLS Politikası
DROP POLICY IF EXISTS "sgk_isten_cikis_kayitlari_tenant_policy" ON sgk_isten_cikis_kayitlari;
CREATE POLICY "sgk_isten_cikis_kayitlari_tenant_policy" ON sgk_isten_cikis_kayitlari
  FOR ALL USING (
    auth.jwt() ->> 'tenant_id' IS NOT NULL AND
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  ) WITH CHECK (
    auth.jwt() ->> 'tenant_id' IS NOT NULL AND
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

-- SGK İşlem Geçmişi RLS Politikası
DROP POLICY IF EXISTS "sgk_islem_gecmisi_tenant_policy" ON sgk_islem_gecmisi;
CREATE POLICY "sgk_islem_gecmisi_tenant_policy" ON sgk_islem_gecmisi
  FOR ALL USING (
    auth.jwt() ->> 'tenant_id' IS NOT NULL AND
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  ) WITH CHECK (
    auth.jwt() ->> 'tenant_id' IS NOT NULL AND
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

-- SGK Dönem Bilgileri RLS Politikası
DROP POLICY IF EXISTS "sgk_donem_bilgileri_tenant_policy" ON sgk_donem_bilgileri;
CREATE POLICY "sgk_donem_bilgileri_tenant_policy" ON sgk_donem_bilgileri
  FOR ALL USING (
    auth.jwt() ->> 'tenant_id' IS NOT NULL AND
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  ) WITH CHECK (
    auth.jwt() ->> 'tenant_id' IS NOT NULL AND
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

-- SGK Sorgulama Geçmişi RLS Politikası
DROP POLICY IF EXISTS "sgk_sorgulama_gecmisi_tenant_policy" ON sgk_sorgulama_gecmisi;
CREATE POLICY "sgk_sorgulama_gecmisi_tenant_policy" ON sgk_sorgulama_gecmisi
  FOR ALL USING (
    auth.jwt() ->> 'tenant_id' IS NOT NULL AND
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  ) WITH CHECK (
    auth.jwt() ->> 'tenant_id' IS NOT NULL AND
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

-- SGK PDF Dokümanları RLS Politikası
DROP POLICY IF EXISTS "sgk_pdf_dokumanlari_tenant_policy" ON sgk_pdf_dokumanlari;
CREATE POLICY "sgk_pdf_dokumanlari_tenant_policy" ON sgk_pdf_dokumanlari
  FOR ALL USING (
    auth.jwt() ->> 'tenant_id' IS NOT NULL AND
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  ) WITH CHECK (
    auth.jwt() ->> 'tenant_id' IS NOT NULL AND
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_sgk_ise_giris_personnel_id ON sgk_ise_giris_kayitlari(personnel_id);
CREATE INDEX IF NOT EXISTS idx_sgk_ise_giris_tckimlik_no ON sgk_ise_giris_kayitlari(tckimlik_no);
CREATE INDEX IF NOT EXISTS idx_sgk_ise_giris_durum ON sgk_ise_giris_kayitlari(durum);
CREATE INDEX IF NOT EXISTS idx_sgk_ise_giris_giris_tarihi ON sgk_ise_giris_kayitlari(giris_tarihi);

CREATE INDEX IF NOT EXISTS idx_sgk_isten_cikis_personnel_id ON sgk_isten_cikis_kayitlari(personnel_id);
CREATE INDEX IF NOT EXISTS idx_sgk_isten_cikis_tckimlik_no ON sgk_isten_cikis_kayitlari(tckimlik_no);
CREATE INDEX IF NOT EXISTS idx_sgk_isten_cikis_durum ON sgk_isten_cikis_kayitlari(durum);
CREATE INDEX IF NOT EXISTS idx_sgk_isten_cikis_cikis_tarihi ON sgk_isten_cikis_kayitlari(cikis_tarihi);

CREATE INDEX IF NOT EXISTS idx_sgk_islem_gecmisi_tenant_id ON sgk_islem_gecmisi(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sgk_islem_gecmisi_islem_tipi ON sgk_islem_gecmisi(islem_tipi);
CREATE INDEX IF NOT EXISTS idx_sgk_islem_gecmisi_islem_tarihi ON sgk_islem_gecmisi(islem_tarihi);

CREATE INDEX IF NOT EXISTS idx_sgk_pdf_dokumanlari_referans_kodu ON sgk_pdf_dokumanlari(referans_kodu);
CREATE INDEX IF NOT EXISTS idx_sgk_pdf_dokumanlari_dokuman_tipi ON sgk_pdf_dokumanlari(dokuman_tipi);
CREATE INDEX IF NOT EXISTS idx_sgk_pdf_dokumanlari_durum ON sgk_pdf_dokumanlari(durum);
CREATE INDEX IF NOT EXISTS idx_sgk_pdf_dokumanlari_ise_giris_id ON sgk_pdf_dokumanlari(sgk_ise_giris_id);
CREATE INDEX IF NOT EXISTS idx_sgk_pdf_dokumanlari_isten_cikis_id ON sgk_pdf_dokumanlari(sgk_isten_cikis_id);

-- Yeni tablolar için indeksler
CREATE INDEX IF NOT EXISTS idx_sgk_donem_bilgileri_isten_cikis_id ON sgk_donem_bilgileri(sgk_isten_cikis_id);
CREATE INDEX IF NOT EXISTS idx_sgk_donem_bilgileri_donem_turu ON sgk_donem_bilgileri(donem_turu);
CREATE INDEX IF NOT EXISTS idx_sgk_donem_bilgileri_belge_turu ON sgk_donem_bilgileri(belge_turu);

CREATE INDEX IF NOT EXISTS idx_sgk_sorgulama_gecmisi_tenant_id ON sgk_sorgulama_gecmisi(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sgk_sorgulama_gecmisi_sorgulama_tipi ON sgk_sorgulama_gecmisi(sorgulama_tipi);
CREATE INDEX IF NOT EXISTS idx_sgk_sorgulama_gecmisi_tckimlik_no ON sgk_sorgulama_gecmisi(tckimlik_no);
CREATE INDEX IF NOT EXISTS idx_sgk_sorgulama_gecmisi_islem_tarihi ON sgk_sorgulama_gecmisi(islem_tarihi);

-- Ek indeksler
CREATE INDEX IF NOT EXISTS idx_sgk_ise_giris_sigorta_turu ON sgk_ise_giris_kayitlari(sigorta_turu);
CREATE INDEX IF NOT EXISTS idx_sgk_ise_giris_gorevkodu ON sgk_ise_giris_kayitlari(gorevkodu);
CREATE INDEX IF NOT EXISTS idx_sgk_isten_cikis_cikis_nedeni ON sgk_isten_cikis_kayitlari(isten_cikis_nedeni);
CREATE INDEX IF NOT EXISTS idx_sgk_islem_gecmisi_basarili_mi ON sgk_islem_gecmisi(basarili_mi);

-- Trigger'lar - Updated_at otomatik güncelleme
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_sgk_credentials_updated_at ON sgk_credentials;
CREATE TRIGGER update_sgk_credentials_updated_at BEFORE UPDATE ON sgk_credentials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sgk_ise_giris_kayitlari_updated_at ON sgk_ise_giris_kayitlari;
CREATE TRIGGER update_sgk_ise_giris_kayitlari_updated_at BEFORE UPDATE ON sgk_ise_giris_kayitlari
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sgk_isten_cikis_kayitlari_updated_at ON sgk_isten_cikis_kayitlari;
CREATE TRIGGER update_sgk_isten_cikis_kayitlari_updated_at BEFORE UPDATE ON sgk_isten_cikis_kayitlari
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sgk_donem_bilgileri_updated_at ON sgk_donem_bilgileri;
CREATE TRIGGER update_sgk_donem_bilgileri_updated_at BEFORE UPDATE ON sgk_donem_bilgileri
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sgk_pdf_dokumanlari_updated_at ON sgk_pdf_dokumanlari;
CREATE TRIGGER update_sgk_pdf_dokumanlari_updated_at BEFORE UPDATE ON sgk_pdf_dokumanlari
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Yorumlar
COMMENT ON TABLE sgk_credentials IS 'SGK Web Servis kimlik bilgileri - Test/Production ortam desteği ile';
COMMENT ON TABLE sgk_ise_giris_kayitlari IS 'SGK İşe Giriş Kayıtları - TAM parametreler ile';
COMMENT ON TABLE sgk_isten_cikis_kayitlari IS 'SGK İşten Çıkış Kayıtları - TAM parametreler ile';
COMMENT ON TABLE sgk_donem_bilgileri IS 'SGK Dönem Bilgileri - Bulunduğumuz ve Önceki Dönem';
COMMENT ON TABLE sgk_sorgulama_gecmisi IS 'SGK Sorgulama Geçmişi - Tüm sorgulama türleri';
COMMENT ON TABLE sgk_islem_gecmisi IS 'SGK İşlem Geçmişi ve Logları - Detaylı istatistikler ile';
COMMENT ON TABLE sgk_pdf_dokumanlari IS 'SGK PDF Dokümanları - Byte array desteği ile';

COMMENT ON COLUMN sgk_credentials.isyeri_sicil IS '26 haneli SGK işyeri sicil numarası';
COMMENT ON COLUMN sgk_credentials.is_test_mode IS 'Test ortamı kullanılıyor mu?';
COMMENT ON COLUMN sgk_credentials.failed_attempts IS 'Başarısız giriş denemesi sayısı';
COMMENT ON COLUMN sgk_credentials.locked_until IS 'Hesap kilitlenme süresi';

COMMENT ON COLUMN sgk_ise_giris_kayitlari.sigorta_turu IS 'SGK sigorta türü kodu (0-37 arası)';
COMMENT ON COLUMN sgk_ise_giris_kayitlari.gorevkodu IS 'Görev kodu (01-06)';
COMMENT ON COLUMN sgk_ise_giris_kayitlari.meslekkodu IS 'İşkur meslek kodu (9999.99 formatında)';
COMMENT ON COLUMN sgk_ise_giris_kayitlari.csgbiskolu IS 'ÇSGB iş kolu (01-20)';
COMMENT ON COLUMN sgk_ise_giris_kayitlari.eskihukumlu IS 'Eski hükümlü (E/H)';
COMMENT ON COLUMN sgk_ise_giris_kayitlari.ozurlu IS 'Engelli (E/H)';
COMMENT ON COLUMN sgk_ise_giris_kayitlari.ogrenimkodu IS 'Öğrenim kodu (0-7)';
COMMENT ON COLUMN sgk_ise_giris_kayitlari.kismi_sureli_calisiyormu IS 'Kısmi süreli çalışma (E/H)';
COMMENT ON COLUMN sgk_ise_giris_kayitlari.kismi_sureli_calisma_gun_sayisi IS 'Kısmi süreli gün sayısı (1-29)';
COMMENT ON COLUMN sgk_ise_giris_kayitlari.sgk_referans_kodu IS 'SGK tarafından üretilen referans kodu';

COMMENT ON COLUMN sgk_isten_cikis_kayitlari.isten_cikis_nedeni IS 'İşten çıkış nedeni (01-37)';
COMMENT ON COLUMN sgk_isten_cikis_kayitlari.meslekkodu IS 'İşkur meslek kodu (9999.99 formatında)';
COMMENT ON COLUMN sgk_isten_cikis_kayitlari.csgbiskolu IS 'ÇSGB iş kolu (01-20)';
COMMENT ON COLUMN sgk_isten_cikis_kayitlari.nakil_gidecegi_isyeri_sicil IS 'Nakil gideceği işyeri sicil (26 hane)';
COMMENT ON COLUMN sgk_isten_cikis_kayitlari.sgk_referans_kodu IS 'SGK tarafından üretilen referans kodu';

COMMENT ON COLUMN sgk_donem_bilgileri.donem_turu IS 'Dönem türü (bulundugumuz/onceki)';
COMMENT ON COLUMN sgk_donem_bilgileri.belge_turu IS 'Belge türü (01-51)';
COMMENT ON COLUMN sgk_donem_bilgileri.hakedilen_ucret IS 'Hakedilen ücret tutarı';
COMMENT ON COLUMN sgk_donem_bilgileri.prim_ikramiye IS 'Prim ikramiye tutarı';
COMMENT ON COLUMN sgk_donem_bilgileri.eksik_gun_sayisi IS 'Eksik gün sayısı (1-31)';
COMMENT ON COLUMN sgk_donem_bilgileri.eksik_gun_nedeni IS 'Eksik gün nedeni (00-24)';

COMMENT ON COLUMN sgk_sorgulama_gecmisi.sorgulama_tipi IS 'Sorgulama türü (tc_ile_ise_giris, tc_ile_isten_cikis, vb.)';
COMMENT ON COLUMN sgk_sorgulama_gecmisi.sgk_yanit_data IS 'SGK dan dönen tam yanıt (JSON)';
COMMENT ON COLUMN sgk_sorgulama_gecmisi.bulunan_kayit_sayisi IS 'Bulunan kayıt sayısı';
COMMENT ON COLUMN sgk_sorgulama_gecmisi.islem_suresi_ms IS 'İşlem süresi (milisaniye)';

COMMENT ON COLUMN sgk_islem_gecmisi.islem_parametreleri IS 'Gönderilen parametreler (JSON)';
COMMENT ON COLUMN sgk_islem_gecmisi.islem_sonucu IS 'Dönen sonuç (JSON)';
COMMENT ON COLUMN sgk_islem_gecmisi.islem_boyutu_bytes IS 'Gönderilen veri boyutu';
COMMENT ON COLUMN sgk_islem_gecmisi.basarili_mi IS 'İşlem başarılı mı?';
COMMENT ON COLUMN sgk_islem_gecmisi.kullanici_ip IS 'Kullanıcı IP adresi';

COMMENT ON COLUMN sgk_pdf_dokumanlari.pdf_byte_array IS 'PDF byte array (isteğe bağlı saklama)';
COMMENT ON COLUMN sgk_pdf_dokumanlari.pdf_sayfa_sayisi IS 'PDF sayfa sayısı';
COMMENT ON COLUMN sgk_pdf_dokumanlari.indirme_sayisi IS 'İndirme sayısı';
COMMENT ON COLUMN sgk_pdf_dokumanlari.son_indirme_tarihi IS 'Son indirme tarihi';

-- SGK Bildirimler Tablosu
CREATE TABLE IF NOT EXISTS sgk_bildirimler (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  bildirim_tipi VARCHAR(20) NOT NULL CHECK (bildirim_tipi IN ('success', 'error', 'warning', 'info', 'critical')),
  baslik VARCHAR(255) NOT NULL,
  mesaj TEXT NOT NULL,
  detay TEXT,
  kategori VARCHAR(50) NOT NULL CHECK (kategori IN ('ise_giris', 'isten_cikis', 'sorgulama', 'pdf', 'nakil', 'donem', 'test', 'guvenlik', 'sistem')),
  oncelik VARCHAR(20) NOT NULL CHECK (oncelik IN ('dusuk', 'orta', 'yuksek', 'kritik')),
  okundu BOOLEAN DEFAULT FALSE,
  okunma_tarihi TIMESTAMP WITH TIME ZONE,
  olusturma_tarihi TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sona_erme_tarihi TIMESTAMP WITH TIME ZONE,
  aktif_mi BOOLEAN DEFAULT TRUE,
  kullanici_id UUID,
  eylemler JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SGK Bildirimler RLS Politikası
DROP POLICY IF EXISTS sgk_bildirimler_tenant_policy ON sgk_bildirimler;
CREATE POLICY sgk_bildirimler_tenant_policy ON sgk_bildirimler
  FOR ALL USING (
    auth.jwt() ->> 'tenant_id' IS NOT NULL AND 
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

-- SGK Bildirimler İndeksleri
CREATE INDEX IF NOT EXISTS idx_sgk_bildirimler_tenant_id ON sgk_bildirimler(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sgk_bildirimler_bildirim_tipi ON sgk_bildirimler(bildirim_tipi);
CREATE INDEX IF NOT EXISTS idx_sgk_bildirimler_kategori ON sgk_bildirimler(kategori);
CREATE INDEX IF NOT EXISTS idx_sgk_bildirimler_oncelik ON sgk_bildirimler(oncelik);
CREATE INDEX IF NOT EXISTS idx_sgk_bildirimler_okundu ON sgk_bildirimler(okundu);
CREATE INDEX IF NOT EXISTS idx_sgk_bildirimler_aktif_mi ON sgk_bildirimler(aktif_mi);
CREATE INDEX IF NOT EXISTS idx_sgk_bildirimler_olusturma_tarihi ON sgk_bildirimler(olusturma_tarihi);
CREATE INDEX IF NOT EXISTS idx_sgk_bildirimler_kullanici_id ON sgk_bildirimler(kullanici_id);

-- SGK Bildirimler Trigger
DROP TRIGGER IF EXISTS update_sgk_bildirimler_updated_at ON sgk_bildirimler;
CREATE TRIGGER update_sgk_bildirimler_updated_at
  BEFORE UPDATE ON sgk_bildirimler
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- SGK Bildirimler Tablosu Yorumları
COMMENT ON TABLE sgk_bildirimler IS 'SGK bildirim ve uyarı sistemi tablosu';
COMMENT ON COLUMN sgk_bildirimler.bildirim_tipi IS 'Bildirim türü (success, error, warning, info, critical)';
COMMENT ON COLUMN sgk_bildirimler.baslik IS 'Bildirim başlığı';
COMMENT ON COLUMN sgk_bildirimler.mesaj IS 'Bildirim mesajı';
COMMENT ON COLUMN sgk_bildirimler.detay IS 'Detaylı açıklama';
COMMENT ON COLUMN sgk_bildirimler.kategori IS 'Bildirim kategorisi';
COMMENT ON COLUMN sgk_bildirimler.oncelik IS 'Bildirim önceliği (dusuk, orta, yuksek, kritik)';
COMMENT ON COLUMN sgk_bildirimler.okundu IS 'Bildirim okundu mu?';
COMMENT ON COLUMN sgk_bildirimler.okunma_tarihi IS 'Okunma tarihi';
COMMENT ON COLUMN sgk_bildirimler.sona_erme_tarihi IS 'Sona erme tarihi';
COMMENT ON COLUMN sgk_bildirimler.aktif_mi IS 'Bildirim aktif mi?';
COMMENT ON COLUMN sgk_bildirimler.eylemler IS 'Bildirim eylemleri (JSON)';

-- SGK Raporlar Tablosu
CREATE TABLE IF NOT EXISTS sgk_raporlar (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  rapor_adi VARCHAR(255) NOT NULL,
  rapor_tipi VARCHAR(50) NOT NULL CHECK (rapor_tipi IN ('ise_giris', 'isten_cikis', 'sorgulama', 'pdf', 'nakil', 'donem', 'test', 'guvenlik', 'genel')),
  baslangic_tarihi DATE NOT NULL,
  bitis_tarihi DATE NOT NULL,
  olusturma_tarihi TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  olusturan_kullanici_id UUID,
  rapor_parametreleri JSONB,
  rapor_sonuclari JSONB,
  rapor_durumu VARCHAR(20) DEFAULT 'hazirlaniyor' CHECK (rapor_durumu IN ('hazirlaniyor', 'tamamlandi', 'hata')),
  dosya_yolu VARCHAR(500),
  dosya_boyutu BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SGK Raporlar RLS Politikası
DROP POLICY IF EXISTS sgk_raporlar_tenant_policy ON sgk_raporlar;
CREATE POLICY sgk_raporlar_tenant_policy ON sgk_raporlar
  FOR ALL USING (
    auth.jwt() ->> 'tenant_id' IS NOT NULL AND 
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

-- SGK Raporlar İndeksleri
CREATE INDEX IF NOT EXISTS idx_sgk_raporlar_tenant_id ON sgk_raporlar(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sgk_raporlar_rapor_tipi ON sgk_raporlar(rapor_tipi);
CREATE INDEX IF NOT EXISTS idx_sgk_raporlar_rapor_durumu ON sgk_raporlar(rapor_durumu);
CREATE INDEX IF NOT EXISTS idx_sgk_raporlar_olusturma_tarihi ON sgk_raporlar(olusturma_tarihi);
CREATE INDEX IF NOT EXISTS idx_sgk_raporlar_baslangic_tarihi ON sgk_raporlar(baslangic_tarihi);
CREATE INDEX IF NOT EXISTS idx_sgk_raporlar_bitis_tarihi ON sgk_raporlar(bitis_tarihi);
CREATE INDEX IF NOT EXISTS idx_sgk_raporlar_olusturan_kullanici_id ON sgk_raporlar(olusturan_kullanici_id);

-- SGK Testler Tablosu
CREATE TABLE IF NOT EXISTS sgk_testler (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    test_adi VARCHAR(255) NOT NULL,
    test_tipi VARCHAR(50) NOT NULL CHECK (test_tipi IN ('baglanti', 'kimlik_dogrulama', 'ise_giris', 'isten_cikis', 'sorgulama', 'pdf', 'nakil', 'donem', 'guvenlik', 'performans')),
    test_durumu VARCHAR(50) DEFAULT 'beklemede' CHECK (test_durumu IN ('beklemede', 'calisiyor', 'basarili', 'basarisiz', 'iptal')),
    test_sonucu TEXT,
    test_hata_mesaji TEXT,
    test_detaylari TEXT,
    test_parametreleri JSONB,
    test_loglari JSONB,
    test_suresi INTEGER DEFAULT 0,
    test_tarihi TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    test_suite_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SGK Test Suite Tablosu
CREATE TABLE IF NOT EXISTS sgk_test_suite (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    suite_adi VARCHAR(255) NOT NULL,
    suite_durumu VARCHAR(50) DEFAULT 'beklemede' CHECK (suite_durumu IN ('beklemede', 'calisiyor', 'basarili', 'basarisiz', 'iptal')),
    toplam_test INTEGER DEFAULT 0,
    basarili_test INTEGER DEFAULT 0,
    basarisiz_test INTEGER DEFAULT 0,
    calisan_test INTEGER DEFAULT 0,
    suite_suresi INTEGER DEFAULT 0,
    suite_tarihi TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    suite_sonucu TEXT,
    suite_detaylari TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SGK Testler RLS Politikası
DROP POLICY IF EXISTS sgk_testler_tenant_policy ON sgk_testler;
CREATE POLICY sgk_testler_tenant_policy ON sgk_testler
  FOR ALL USING (
    auth.jwt() ->> 'tenant_id' IS NOT NULL AND 
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

-- SGK Test Suite RLS Politikası
DROP POLICY IF EXISTS sgk_test_suite_tenant_policy ON sgk_test_suite;
CREATE POLICY sgk_test_suite_tenant_policy ON sgk_test_suite
  FOR ALL USING (
    auth.jwt() ->> 'tenant_id' IS NOT NULL AND 
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

-- SGK Testler İndeksleri
CREATE INDEX IF NOT EXISTS idx_sgk_testler_tenant_id ON sgk_testler(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sgk_testler_test_tipi ON sgk_testler(test_tipi);
CREATE INDEX IF NOT EXISTS idx_sgk_testler_test_durumu ON sgk_testler(test_durumu);
CREATE INDEX IF NOT EXISTS idx_sgk_testler_test_tarihi ON sgk_testler(test_tarihi);
CREATE INDEX IF NOT EXISTS idx_sgk_testler_test_suite_id ON sgk_testler(test_suite_id);

-- SGK Test Suite İndeksleri
CREATE INDEX IF NOT EXISTS idx_sgk_test_suite_tenant_id ON sgk_test_suite(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sgk_test_suite_suite_durumu ON sgk_test_suite(suite_durumu);
CREATE INDEX IF NOT EXISTS idx_sgk_test_suite_suite_tarihi ON sgk_test_suite(suite_tarihi);

-- SGK Testler Trigger
DROP TRIGGER IF EXISTS update_sgk_testler_updated_at ON sgk_testler;
CREATE TRIGGER update_sgk_testler_updated_at
  BEFORE UPDATE ON sgk_testler
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- SGK Test Suite Trigger
DROP TRIGGER IF EXISTS update_sgk_test_suite_updated_at ON sgk_test_suite;
CREATE TRIGGER update_sgk_test_suite_updated_at
  BEFORE UPDATE ON sgk_test_suite
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- SGK Raporlar Trigger
DROP TRIGGER IF EXISTS update_sgk_raporlar_updated_at ON sgk_raporlar;
CREATE TRIGGER update_sgk_raporlar_updated_at
  BEFORE UPDATE ON sgk_raporlar
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- SGK Raporlar Tablosu Yorumları
COMMENT ON TABLE sgk_raporlar IS 'SGK raporlama ve analiz sistemi tablosu';
COMMENT ON COLUMN sgk_raporlar.rapor_adi IS 'Rapor adı';
COMMENT ON COLUMN sgk_raporlar.rapor_tipi IS 'Rapor türü (ise_giris, isten_cikis, sorgulama, pdf, nakil, donem, test, guvenlik, genel)';
COMMENT ON COLUMN sgk_raporlar.baslangic_tarihi IS 'Rapor başlangıç tarihi';
COMMENT ON COLUMN sgk_raporlar.bitis_tarihi IS 'Rapor bitiş tarihi';
COMMENT ON COLUMN sgk_raporlar.olusturma_tarihi IS 'Rapor oluşturma tarihi';
COMMENT ON COLUMN sgk_raporlar.olusturan_kullanici_id IS 'Raporu oluşturan kullanıcı ID';
COMMENT ON COLUMN sgk_raporlar.rapor_parametreleri IS 'Rapor parametreleri (JSON)';
COMMENT ON COLUMN sgk_raporlar.rapor_sonuclari IS 'Rapor sonuçları (JSON)';
COMMENT ON COLUMN sgk_raporlar.rapor_durumu IS 'Rapor durumu (hazirlaniyor, tamamlandi, hata)';
COMMENT ON COLUMN sgk_raporlar.dosya_yolu IS 'Rapor dosya yolu';
COMMENT ON COLUMN sgk_raporlar.dosya_boyutu IS 'Rapor dosya boyutu (byte)';

-- SGK Testler Tablosu Yorumları
COMMENT ON TABLE sgk_testler IS 'SGK entegrasyon testleri tablosu';
COMMENT ON COLUMN sgk_testler.test_adi IS 'Test adı';
COMMENT ON COLUMN sgk_testler.test_tipi IS 'Test türü (baglanti, kimlik_dogrulama, ise_giris, isten_cikis, sorgulama, pdf, nakil, donem, guvenlik, performans)';
COMMENT ON COLUMN sgk_testler.test_durumu IS 'Test durumu (beklemede, calisiyor, basarili, basarisiz, iptal)';
COMMENT ON COLUMN sgk_testler.test_sonucu IS 'Test sonucu';
COMMENT ON COLUMN sgk_testler.test_hata_mesaji IS 'Test hata mesajı';
COMMENT ON COLUMN sgk_testler.test_detaylari IS 'Test detayları';
COMMENT ON COLUMN sgk_testler.test_parametreleri IS 'Test parametreleri (JSON)';
COMMENT ON COLUMN sgk_testler.test_loglari IS 'Test logları (JSON)';
COMMENT ON COLUMN sgk_testler.test_suresi IS 'Test süresi (milisaniye)';
COMMENT ON COLUMN sgk_testler.test_tarihi IS 'Test tarihi';
COMMENT ON COLUMN sgk_testler.test_suite_id IS 'Test suite ID';

-- SGK Test Suite Tablosu Yorumları
COMMENT ON TABLE sgk_test_suite IS 'SGK test suite tablosu';
COMMENT ON COLUMN sgk_test_suite.suite_adi IS 'Test suite adı';
COMMENT ON COLUMN sgk_test_suite.suite_durumu IS 'Test suite durumu (beklemede, calisiyor, basarili, basarisiz, iptal)';
COMMENT ON COLUMN sgk_test_suite.toplam_test IS 'Toplam test sayısı';
COMMENT ON COLUMN sgk_test_suite.basarili_test IS 'Başarılı test sayısı';
COMMENT ON COLUMN sgk_test_suite.basarisiz_test IS 'Başarısız test sayısı';
COMMENT ON COLUMN sgk_test_suite.calisan_test IS 'Çalışan test sayısı';
COMMENT ON COLUMN sgk_test_suite.suite_suresi IS 'Test suite süresi (milisaniye)';
COMMENT ON COLUMN sgk_test_suite.suite_tarihi IS 'Test suite tarihi';
COMMENT ON COLUMN sgk_test_suite.suite_sonucu IS 'Test suite sonucu';
COMMENT ON COLUMN sgk_test_suite.suite_detaylari IS 'Test suite detayları';
