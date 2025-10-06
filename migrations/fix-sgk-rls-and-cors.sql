-- Fix SGK RLS Policies and Authentication Issues
-- Run this in Supabase SQL Editor

-- 1. First, let's check the current user and tenant situation
SELECT 'Current auth info:' as info;
SELECT auth.uid() as user_id, auth.email() as email, auth.role() as role;

-- 2. Check if user exists in users table
SELECT 'User in users table:' as info;
SELECT id, email, full_name, role, tenant_id 
FROM public.users 
WHERE id = auth.uid();

-- 3. Check tenant for ahmet subdomain
SELECT 'Tenant info:' as info;
SELECT id, name, subdomain, status FROM public.tenants WHERE subdomain = 'ahmet';

-- 4. Fix user if needed - ensure user has proper tenant_id
INSERT INTO public.users (id, email, full_name, role, tenant_id)
SELECT 
    auth.uid(),
    auth.email(),
    COALESCE(auth.jwt() ->> 'full_name', 'Admin User'),
    'admin',
    (SELECT id FROM public.tenants WHERE subdomain = 'ahmet' LIMIT 1)
WHERE auth.uid() IS NOT NULL 
AND NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid());

-- 5. Update user's tenant_id if it's null
UPDATE public.users 
SET tenant_id = (SELECT id FROM public.tenants WHERE subdomain = 'ahmet' LIMIT 1)
WHERE id = auth.uid() 
AND tenant_id IS NULL;

-- 6. Create a function to get tenant_id from JWT or user table
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS UUID AS $$
DECLARE
    user_tenant_id UUID;
BEGIN
    -- First try to get from JWT
    IF auth.jwt() ->> 'tenant_id' IS NOT NULL THEN
        RETURN (auth.jwt() ->> 'tenant_id')::uuid;
    END IF;
    
    -- If not in JWT, get from users table
    SELECT tenant_id INTO user_tenant_id
    FROM public.users 
    WHERE id = auth.uid();
    
    RETURN user_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Drop existing SGK RLS policies
DROP POLICY IF EXISTS "sgk_credentials_tenant_policy" ON sgk_credentials;
DROP POLICY IF EXISTS "sgk_ise_giris_kayitlari_tenant_policy" ON sgk_ise_giris_kayitlari;
DROP POLICY IF EXISTS "sgk_isten_cikis_kayitlari_tenant_policy" ON sgk_isten_cikis_kayitlari;
DROP POLICY IF EXISTS "sgk_islem_gecmisi_tenant_policy" ON sgk_islem_gecmisi;
DROP POLICY IF EXISTS "sgk_donem_bilgileri_tenant_policy" ON sgk_donem_bilgileri;
DROP POLICY IF EXISTS "sgk_sorgulama_gecmisi_tenant_policy" ON sgk_sorgulama_gecmisi;
DROP POLICY IF EXISTS "sgk_pdf_dokumanlari_tenant_policy" ON sgk_pdf_dokumanlari;

-- 8. Create improved SGK RLS policies using the helper function
CREATE POLICY "sgk_credentials_tenant_policy" ON sgk_credentials
  FOR ALL USING (
    tenant_id = public.get_user_tenant_id()
  ) WITH CHECK (
    tenant_id = public.get_user_tenant_id()
  );

CREATE POLICY "sgk_ise_giris_kayitlari_tenant_policy" ON sgk_ise_giris_kayitlari
  FOR ALL USING (
    tenant_id = public.get_user_tenant_id()
  ) WITH CHECK (
    tenant_id = public.get_user_tenant_id()
  );

CREATE POLICY "sgk_isten_cikis_kayitlari_tenant_policy" ON sgk_isten_cikis_kayitlari
  FOR ALL USING (
    tenant_id = public.get_user_tenant_id()
  ) WITH CHECK (
    tenant_id = public.get_user_tenant_id()
  );

CREATE POLICY "sgk_islem_gecmisi_tenant_policy" ON sgk_islem_gecmisi
  FOR ALL USING (
    tenant_id = public.get_user_tenant_id()
  ) WITH CHECK (
    tenant_id = public.get_user_tenant_id()
  );

CREATE POLICY "sgk_donem_bilgileri_tenant_policy" ON sgk_donem_bilgileri
  FOR ALL USING (
    tenant_id = public.get_user_tenant_id()
  ) WITH CHECK (
    tenant_id = public.get_user_tenant_id()
  );

CREATE POLICY "sgk_sorgulama_gecmisi_tenant_policy" ON sgk_sorgulama_gecmisi
  FOR ALL USING (
    tenant_id = public.get_user_tenant_id()
  ) WITH CHECK (
    tenant_id = public.get_user_tenant_id()
  );

CREATE POLICY "sgk_pdf_dokumanlari_tenant_policy" ON sgk_pdf_dokumanlari
  FOR ALL USING (
    tenant_id = public.get_user_tenant_id()
  ) WITH CHECK (
    tenant_id = public.get_user_tenant_id()
  );

-- 9. Also fix corporate_settings RLS policy
DROP POLICY IF EXISTS "corporate_settings_tenant_policy" ON corporate_settings;
CREATE POLICY "corporate_settings_tenant_policy" ON corporate_settings
  FOR ALL USING (
    tenant_id = public.get_user_tenant_id()
  ) WITH CHECK (
    tenant_id = public.get_user_tenant_id()
  );

-- 10. Test the policies
SELECT 'Testing SGK policies:' as info;
SELECT COUNT(*) as sgk_credentials_count FROM sgk_credentials;
SELECT COUNT(*) as sgk_ise_giris_count FROM sgk_ise_giris_kayitlari;
SELECT COUNT(*) as corporate_settings_count FROM corporate_settings;

-- 11. Show current user's tenant info
SELECT 'Current user tenant info:' as info;
SELECT 
    u.id as user_id,
    u.email,
    u.full_name,
    u.tenant_id,
    t.name as tenant_name,
    t.subdomain
FROM public.users u
LEFT JOIN public.tenants t ON u.tenant_id = t.id
WHERE u.id = auth.uid();
