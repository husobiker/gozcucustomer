-- RLS Politikasını Basit Hale Getir
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- 1. Mevcut personel politikalarını kaldır
DROP POLICY IF EXISTS "personnel_tenant_project_policy" ON personnel;
DROP POLICY IF EXISTS "personnel_tenant_policy" ON personnel;
DROP POLICY IF EXISTS "personnel_policy" ON personnel;
DROP POLICY IF EXISTS "personnel_project_policy" ON personnel;

-- 2. Basit personel politikası oluştur (sadece tenant_id kontrolü)
CREATE POLICY "personnel_simple_policy" ON personnel
  FOR ALL USING (
    tenant_id = public.get_user_tenant_id()
  ) WITH CHECK (
    tenant_id = public.get_user_tenant_id()
  );

-- 3. Test et
SELECT 'Personel RLS politikası basitleştirildi!' as status;
SELECT COUNT(*) as total_personnel_count FROM personnel;
SELECT COUNT(*) as personnel_active_count FROM personnel WHERE status = 'Aktif';

