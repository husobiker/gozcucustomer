-- Personel RLS'yi Tamamen Kaldır
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- 1. Personel RLS'yi devre dışı bırak
ALTER TABLE public.personnel DISABLE ROW LEVEL SECURITY;

-- 2. Mevcut politikaları kaldır
DROP POLICY IF EXISTS "personnel_simple_policy" ON personnel;
DROP POLICY IF EXISTS "personnel_tenant_project_policy" ON personnel;
DROP POLICY IF EXISTS "personnel_tenant_policy" ON personnel;
DROP POLICY IF EXISTS "personnel_policy" ON personnel;
DROP POLICY IF EXISTS "personnel_project_policy" ON personnel;

-- 3. Test et
SELECT 'Personel RLS tamamen kaldırıldı!' as status;
SELECT COUNT(*) as total_personnel_count FROM personnel;
SELECT COUNT(*) as personnel_active_count FROM personnel WHERE status = 'Aktif';
SELECT COUNT(*) as parkverde_personnel_count FROM personnel 
WHERE project_id = 'e68213b9-aee2-4344-8369-15dc794126e8' AND status = 'Aktif';

