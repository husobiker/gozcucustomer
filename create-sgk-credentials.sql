-- SGK Credentials oluştur
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- 1. Mevcut tenant'ı al
SELECT 'Tenant bilgileri:' as info;
SELECT id, name, subdomain FROM public.tenants WHERE subdomain = 'ahmet';

-- 2. SGK credentials oluştur (Test İşyeri 1)
INSERT INTO public.sgk_credentials (
  tenant_id,
  kullanici_adi,
  sifre,
  isyeri_sicil,
  is_active,
  created_at,
  updated_at
)
SELECT 
  t.id as tenant_id,
  '12345678901' as kullanici_adi,
  '123456' as sifre,
  '24292090900003010860195000' as isyeri_sicil,
  true as is_active,
  NOW() as created_at,
  NOW() as updated_at
FROM public.tenants t 
WHERE t.subdomain = 'ahmet';

-- 3. Test et
SELECT 'SGK Credentials oluşturuldu!' as status;
SELECT COUNT(*) as sgk_credentials_count FROM sgk_credentials WHERE tenant_id = (SELECT id FROM public.tenants WHERE subdomain = 'ahmet');
SELECT * FROM sgk_credentials WHERE tenant_id = (SELECT id FROM public.tenants WHERE subdomain = 'ahmet');
