-- Personel tablosuna SGK alanları ekleme
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- 1. Mevcut personel tablosunu kontrol et
SELECT 'Personel tablosu mevcut alanları:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'personnel' 
ORDER BY ordinal_position;

-- 2. SGK alanlarını ekle
ALTER TABLE public.personnel 
ADD COLUMN IF NOT EXISTS sgk_sicil_no INTEGER,
ADD COLUMN IF NOT EXISTS sgk_durum VARCHAR(50) DEFAULT 'Giriş Yapılmamış',
ADD COLUMN IF NOT EXISTS sgk_giris_tarihi DATE,
ADD COLUMN IF NOT EXISTS sgk_cikis_tarihi DATE,
ADD COLUMN IF NOT EXISTS sgk_referans_kodu INTEGER;

-- 3. SGK durumu için check constraint ekle
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_sgk_durum'
  ) THEN
    ALTER TABLE public.personnel 
    ADD CONSTRAINT check_sgk_durum 
    CHECK (sgk_durum IN ('Giriş Yapılmamış', 'Aktif', 'Çıkış Yapılmış'));
  END IF;
END $$;

-- 4. SGK referans kodu için unique constraint ekle (opsiyonel)
-- ALTER TABLE public.personnel 
-- ADD CONSTRAINT IF NOT EXISTS unique_sgk_referans_kodu 
-- UNIQUE (sgk_referans_kodu);

-- 5. SGK alanları için index'ler ekle
CREATE INDEX IF NOT EXISTS idx_personnel_sgk_durum ON public.personnel(sgk_durum);
CREATE INDEX IF NOT EXISTS idx_personnel_sgk_sicil_no ON public.personnel(sgk_sicil_no);
CREATE INDEX IF NOT EXISTS idx_personnel_sgk_referans_kodu ON public.personnel(sgk_referans_kodu);

-- 6. SGK alanları için comment'ler ekle
COMMENT ON COLUMN public.personnel.sgk_sicil_no IS 'SGK Sicil Numarası';
COMMENT ON COLUMN public.personnel.sgk_durum IS 'SGK Durumu: Giriş Yapılmamış, Aktif, Çıkış Yapılmış';
COMMENT ON COLUMN public.personnel.sgk_giris_tarihi IS 'SGK İşe Giriş Tarihi';
COMMENT ON COLUMN public.personnel.sgk_cikis_tarihi IS 'SGK İşten Çıkış Tarihi';
COMMENT ON COLUMN public.personnel.sgk_referans_kodu IS 'SGK Referans Kodu';

-- 7. Test verisi ekle (opsiyonel)
-- UPDATE public.personnel 
-- SET sgk_durum = 'Aktif', 
--     sgk_giris_tarihi = CURRENT_DATE,
--     sgk_sicil_no = 12345,
--     sgk_referans_kodu = 98765
-- WHERE id = (SELECT id FROM public.personnel LIMIT 1);

-- 8. Sonuçları kontrol et
SELECT 'SGK alanları başarıyla eklendi!' as status;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'personnel' 
AND column_name LIKE 'sgk_%'
ORDER BY ordinal_position;

-- 9. Personel sayısını kontrol et
SELECT COUNT(*) as total_personnel FROM public.personnel;
SELECT sgk_durum, COUNT(*) as count 
FROM public.personnel 
GROUP BY sgk_durum;