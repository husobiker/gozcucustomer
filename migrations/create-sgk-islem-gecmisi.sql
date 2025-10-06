-- SGK İşlem Geçmişi Tablosu Oluşturma
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- 1. SGK işlem geçmişi tablosunu oluştur
DROP TABLE IF EXISTS public.personnel_sgk_islemleri CASCADE;
CREATE TABLE public.personnel_sgk_islemleri (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  personnel_id UUID NOT NULL REFERENCES public.personnel(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  islem_turu VARCHAR(20) NOT NULL CHECK (islem_turu IN ('ise_giris', 'isten_cikis')),
  sgk_referans_kodu INTEGER,
  sgk_tarih TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sgk_islem_sonucu INTEGER DEFAULT 0,
  sgk_hata_kodu INTEGER,
  sgk_hata_aciklama TEXT,
  sgk_sicil_no INTEGER,
  sgk_ad_soyad VARCHAR(100),
  sgk_islem_aciklamasi TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. RLS politikalarını etkinleştir
ALTER TABLE public.personnel_sgk_islemleri ENABLE ROW LEVEL SECURITY;

-- 3. RLS politikası oluştur
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'personnel_sgk_islemleri' 
    AND policyname = 'personnel_sgk_islemleri_tenant_policy'
  ) THEN
    CREATE POLICY "personnel_sgk_islemleri_tenant_policy" ON public.personnel_sgk_islemleri
      FOR ALL USING (
        tenant_id = public.get_user_tenant_id()
      ) WITH CHECK (
        tenant_id = public.get_user_tenant_id()
      );
  END IF;
END $$;

-- 4. Index'ler ekle
CREATE INDEX IF NOT EXISTS idx_personnel_sgk_islemleri_personnel_id ON public.personnel_sgk_islemleri(personnel_id);
CREATE INDEX IF NOT EXISTS idx_personnel_sgk_islemleri_tenant_id ON public.personnel_sgk_islemleri(tenant_id);
CREATE INDEX IF NOT EXISTS idx_personnel_sgk_islemleri_islem_turu ON public.personnel_sgk_islemleri(islem_turu);
CREATE INDEX IF NOT EXISTS idx_personnel_sgk_islemleri_sgk_tarih ON public.personnel_sgk_islemleri(sgk_tarih);
CREATE INDEX IF NOT EXISTS idx_personnel_sgk_islemleri_sgk_referans_kodu ON public.personnel_sgk_islemleri(sgk_referans_kodu);

-- 5. Comment'ler ekle
COMMENT ON TABLE public.personnel_sgk_islemleri IS 'Personel SGK İşlem Geçmişi';
COMMENT ON COLUMN public.personnel_sgk_islemleri.personnel_id IS 'Personel ID';
COMMENT ON COLUMN public.personnel_sgk_islemleri.tenant_id IS 'Tenant ID';
COMMENT ON COLUMN public.personnel_sgk_islemleri.islem_turu IS 'İşlem Türü: ise_giris, isten_cikis';
COMMENT ON COLUMN public.personnel_sgk_islemleri.sgk_referans_kodu IS 'SGK Referans Kodu';
COMMENT ON COLUMN public.personnel_sgk_islemleri.sgk_tarih IS 'SGK İşlem Tarihi';
COMMENT ON COLUMN public.personnel_sgk_islemleri.sgk_islem_sonucu IS 'SGK İşlem Sonucu (0: Başarılı, 1: Hatalı)';
COMMENT ON COLUMN public.personnel_sgk_islemleri.sgk_hata_kodu IS 'SGK Hata Kodu';
COMMENT ON COLUMN public.personnel_sgk_islemleri.sgk_hata_aciklama IS 'SGK Hata Açıklaması';
COMMENT ON COLUMN public.personnel_sgk_islemleri.sgk_sicil_no IS 'SGK Sicil Numarası';
COMMENT ON COLUMN public.personnel_sgk_islemleri.sgk_ad_soyad IS 'SGK Ad Soyad';
COMMENT ON COLUMN public.personnel_sgk_islemleri.sgk_islem_aciklamasi IS 'SGK İşlem Açıklaması';

-- 6. Trigger fonksiyonu oluştur (updated_at için)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Trigger ekle
DROP TRIGGER IF EXISTS update_personnel_sgk_islemleri_updated_at ON public.personnel_sgk_islemleri;
CREATE TRIGGER update_personnel_sgk_islemleri_updated_at
  BEFORE UPDATE ON public.personnel_sgk_islemleri
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Test verisi ekle (opsiyonel)
DO $$
DECLARE
  v_personnel_id UUID;
  v_tenant_id UUID;
BEGIN
  -- Test personel ve tenant ID'lerini al
  SELECT id INTO v_personnel_id FROM public.personnel LIMIT 1;
  SELECT id INTO v_tenant_id FROM public.tenants LIMIT 1;
  
  -- Test verisi ekle
  IF v_personnel_id IS NOT NULL AND v_tenant_id IS NOT NULL THEN
    INSERT INTO public.personnel_sgk_islemleri (
      personnel_id,
      tenant_id,
      islem_turu,
      sgk_referans_kodu,
      sgk_islem_sonucu,
      sgk_sicil_no,
      sgk_ad_soyad,
      sgk_islem_aciklamasi
    ) VALUES (
      v_personnel_id,
      v_tenant_id,
      'ise_giris',
      12345,
      0,
      67890,
      'Test Personel',
      'İşe giriş işlemi başarılı'
    ) ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- 9. Sonuçları kontrol et
SELECT 'SGK işlem geçmişi tablosu başarıyla oluşturuldu!' as status;
SELECT COUNT(*) as total_records FROM public.personnel_sgk_islemleri;
SELECT islem_turu, COUNT(*) as count 
FROM public.personnel_sgk_islemleri 
GROUP BY islem_turu;
