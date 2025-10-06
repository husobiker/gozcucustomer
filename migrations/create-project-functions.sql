-- Adım 1: Önce fonksiyonları oluştur
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- 1. get_current_project_id fonksiyonu oluştur
CREATE OR REPLACE FUNCTION public.get_current_project_id()
RETURNS UUID AS $$
BEGIN
  RETURN current_setting('app.current_project_id')::uuid;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. set_project_context fonksiyonu oluştur
CREATE OR REPLACE FUNCTION public.set_project_context(project_id UUID)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_project_id', project_id::text, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Test et
SELECT 'Fonksiyonlar oluşturuldu!' as status;
SELECT public.get_current_project_id() as current_project_id;
SELECT public.set_project_context('00000000-0000-0000-0000-000000000000'::uuid) as test_set;

