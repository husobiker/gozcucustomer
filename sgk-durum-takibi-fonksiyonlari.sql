-- SGK Durumu Takibi için Yardımcı Fonksiyonlar
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- 1. Personel SGK durumunu güncelleme fonksiyonu
CREATE OR REPLACE FUNCTION public.update_personnel_sgk_status(
  p_personnel_id UUID,
  p_sgk_durum VARCHAR(50),
  p_sgk_sicil_no INTEGER DEFAULT NULL,
  p_sgk_referans_kodu INTEGER DEFAULT NULL,
  p_sgk_giris_tarihi DATE DEFAULT NULL,
  p_sgk_cikis_tarihi DATE DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Tenant ID'yi al
  SELECT tenant_id INTO v_tenant_id 
  FROM public.personnel 
  WHERE id = p_personnel_id;
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Personel bulunamadı: %', p_personnel_id;
  END IF;
  
  -- Personel SGK durumunu güncelle
  UPDATE public.personnel 
  SET 
    sgk_durum = p_sgk_durum,
    sgk_sicil_no = COALESCE(p_sgk_sicil_no, sgk_sicil_no),
    sgk_referans_kodu = COALESCE(p_sgk_referans_kodu, sgk_referans_kodu),
    sgk_giris_tarihi = COALESCE(p_sgk_giris_tarihi, sgk_giris_tarihi),
    sgk_cikis_tarihi = COALESCE(p_sgk_cikis_tarihi, sgk_cikis_tarihi),
    updated_at = NOW()
  WHERE id = p_personnel_id 
  AND tenant_id = v_tenant_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. SGK işlem geçmişi ekleme fonksiyonu
CREATE OR REPLACE FUNCTION public.add_sgk_islem_gecmisi(
  p_personnel_id UUID,
  p_islem_turu VARCHAR(20),
  p_sgk_referans_kodu INTEGER DEFAULT NULL,
  p_sgk_islem_sonucu INTEGER DEFAULT 0,
  p_sgk_hata_kodu INTEGER DEFAULT NULL,
  p_sgk_hata_aciklama TEXT DEFAULT NULL,
  p_sgk_sicil_no INTEGER DEFAULT NULL,
  p_sgk_ad_soyad VARCHAR(100) DEFAULT NULL,
  p_sgk_islem_aciklamasi TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_tenant_id UUID;
  v_islem_id UUID;
BEGIN
  -- Tenant ID'yi al
  SELECT tenant_id INTO v_tenant_id 
  FROM public.personnel 
  WHERE id = p_personnel_id;
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Personel bulunamadı: %', p_personnel_id;
  END IF;
  
  -- SGK işlem geçmişi ekle
  INSERT INTO public.personnel_sgk_islemleri (
    personnel_id,
    tenant_id,
    islem_turu,
    sgk_referans_kodu,
    sgk_islem_sonucu,
    sgk_hata_kodu,
    sgk_hata_aciklama,
    sgk_sicil_no,
    sgk_ad_soyad,
    sgk_islem_aciklamasi
  ) VALUES (
    p_personnel_id,
    v_tenant_id,
    p_islem_turu,
    p_sgk_referans_kodu,
    p_sgk_islem_sonucu,
    p_sgk_hata_kodu,
    p_sgk_hata_aciklama,
    p_sgk_sicil_no,
    p_sgk_ad_soyad,
    p_sgk_islem_aciklamasi
  ) RETURNING id INTO v_islem_id;
  
  RETURN v_islem_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Personel SGK durumu sorgulama fonksiyonu
CREATE OR REPLACE FUNCTION public.get_personnel_sgk_status(p_personnel_id UUID)
RETURNS TABLE (
  personnel_id UUID,
  sgk_durum VARCHAR(50),
  sgk_sicil_no INTEGER,
  sgk_giris_tarihi DATE,
  sgk_cikis_tarihi DATE,
  sgk_referans_kodu INTEGER,
  son_islem_turu VARCHAR(20),
  son_islem_tarihi TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.sgk_durum,
    p.sgk_sicil_no,
    p.sgk_giris_tarihi,
    p.sgk_cikis_tarihi,
    p.sgk_referans_kodu,
    i.islem_turu,
    i.sgk_tarih
  FROM public.personnel p
  LEFT JOIN LATERAL (
    SELECT islem_turu, sgk_tarih
    FROM public.personnel_sgk_islemleri
    WHERE personnel_id = p.id
    ORDER BY sgk_tarih DESC
    LIMIT 1
  ) i ON true
  WHERE p.id = p_personnel_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. SGK işlem geçmişi sorgulama fonksiyonu
CREATE OR REPLACE FUNCTION public.get_personnel_sgk_islemleri(
  p_personnel_id UUID,
  p_limit INTEGER DEFAULT 10,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  islem_turu VARCHAR(20),
  sgk_referans_kodu INTEGER,
  sgk_tarih TIMESTAMP WITH TIME ZONE,
  sgk_islem_sonucu INTEGER,
  sgk_hata_kodu INTEGER,
  sgk_hata_aciklama TEXT,
  sgk_sicil_no INTEGER,
  sgk_ad_soyad VARCHAR(100),
  sgk_islem_aciklamasi TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.islem_turu,
    i.sgk_referans_kodu,
    i.sgk_tarih,
    i.sgk_islem_sonucu,
    i.sgk_hata_kodu,
    i.sgk_hata_aciklama,
    i.sgk_sicil_no,
    i.sgk_ad_soyad,
    i.sgk_islem_aciklamasi
  FROM public.personnel_sgk_islemleri i
  WHERE i.personnel_id = p_personnel_id
  ORDER BY i.sgk_tarih DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. SGK durumu istatistikleri fonksiyonu
CREATE OR REPLACE FUNCTION public.get_sgk_durum_istatistikleri(p_tenant_id UUID DEFAULT NULL)
RETURNS TABLE (
  sgk_durum VARCHAR(50),
  personel_sayisi BIGINT,
  yuzde NUMERIC
) AS $$
DECLARE
  v_total BIGINT;
BEGIN
  -- Toplam personel sayısını al
  SELECT COUNT(*) INTO v_total
  FROM public.personnel
  WHERE (p_tenant_id IS NULL OR tenant_id = p_tenant_id);
  
  RETURN QUERY
  SELECT 
    p.sgk_durum,
    COUNT(*) as personel_sayisi,
    ROUND((COUNT(*)::NUMERIC / v_total::NUMERIC) * 100, 2) as yuzde
  FROM public.personnel p
  WHERE (p_tenant_id IS NULL OR p.tenant_id = p_tenant_id)
  GROUP BY p.sgk_durum
  ORDER BY personel_sayisi DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Test fonksiyonları
CREATE OR REPLACE FUNCTION public.test_sgk_fonksiyonlari()
RETURNS TABLE (
  test_adi TEXT,
  sonuc TEXT,
  aciklama TEXT
) AS $$
DECLARE
  v_personnel_id UUID;
  v_islem_id UUID;
BEGIN
  -- Test personel ID'sini al
  SELECT id INTO v_personnel_id 
  FROM public.personnel 
  LIMIT 1;
  
  IF v_personnel_id IS NULL THEN
    RETURN QUERY SELECT 'Test Personel Bulunamadı'::TEXT, 'HATA'::TEXT, 'Test için personel bulunamadı'::TEXT;
    RETURN;
  END IF;
  
  -- Test 1: SGK durumu güncelleme
  BEGIN
    PERFORM public.update_personnel_sgk_status(
      v_personnel_id,
      'Aktif',
      12345,
      98765,
      CURRENT_DATE,
      NULL
    );
    RETURN QUERY SELECT 'SGK Durumu Güncelleme'::TEXT, 'BAŞARILI'::TEXT, 'Personel SGK durumu güncellendi'::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'SGK Durumu Güncelleme'::TEXT, 'HATA'::TEXT, SQLERRM::TEXT;
  END;
  
  -- Test 2: SGK işlem geçmişi ekleme
  BEGIN
    SELECT public.add_sgk_islem_gecmisi(
      v_personnel_id,
      'ise_giris',
      98765,
      0,
      NULL,
      NULL,
      12345,
      'Test Personel',
      'Test işlem geçmişi'
    ) INTO v_islem_id;
    RETURN QUERY SELECT 'SGK İşlem Geçmişi Ekleme'::TEXT, 'BAŞARILI'::TEXT, 'İşlem geçmişi eklendi: ' || v_islem_id::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'SGK İşlem Geçmişi Ekleme'::TEXT, 'HATA'::TEXT, SQLERRM::TEXT;
  END;
  
  -- Test 3: SGK durumu sorgulama
  BEGIN
    PERFORM public.get_personnel_sgk_status(v_personnel_id);
    RETURN QUERY SELECT 'SGK Durumu Sorgulama'::TEXT, 'BAŞARILI'::TEXT, 'SGK durumu sorgulandı'::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'SGK Durumu Sorgulama'::TEXT, 'HATA'::TEXT, SQLERRM::TEXT;
  END;
  
  -- Test 4: SGK işlem geçmişi sorgulama
  BEGIN
    PERFORM public.get_personnel_sgk_islemleri(v_personnel_id, 5, 0);
    RETURN QUERY SELECT 'SGK İşlem Geçmişi Sorgulama'::TEXT, 'BAŞARILI'::TEXT, 'İşlem geçmişi sorgulandı'::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'SGK İşlem Geçmişi Sorgulama'::TEXT, 'HATA'::TEXT, SQLERRM::TEXT;
  END;
  
  -- Test 5: SGK durumu istatistikleri
  BEGIN
    PERFORM public.get_sgk_durum_istatistikleri();
    RETURN QUERY SELECT 'SGK Durumu İstatistikleri'::TEXT, 'BAŞARILI'::TEXT, 'İstatistikler sorgulandı'::TEXT;
  EXCEPTION WHEN OTHERS THEN
    RETURN QUERY SELECT 'SGK Durumu İstatistikleri'::TEXT, 'HATA'::TEXT, SQLERRM::TEXT;
  END;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Sonuçları kontrol et
SELECT 'SGK durumu takibi fonksiyonları başarıyla oluşturuldu!' as status;

-- 8. Test fonksiyonunu çalıştır
SELECT * FROM public.test_sgk_fonksiyonlari();

-- 9. SGK durumu istatistikleri
SELECT * FROM public.get_sgk_durum_istatistikleri();

