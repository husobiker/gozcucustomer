-- Create RLS policies for all tables
-- Run this AFTER creating the missing tables
-- Run this in Supabase SQL Editor

-- Drop existing policies first
DROP POLICY IF EXISTS "Tenant project_regions access" ON public.project_regions;
DROP POLICY IF EXISTS "Tenant project_users access" ON public.project_users;
DROP POLICY IF EXISTS "Tenant projects access" ON public.projects;
DROP POLICY IF EXISTS "Tenant personnel access" ON public.personnel;
DROP POLICY IF EXISTS "Tenant checkpoints access" ON public.checkpoints;
DROP POLICY IF EXISTS "Tenant patrols access" ON public.patrols;
DROP POLICY IF EXISTS "Tenant incidents access" ON public.incidents;

-- Create new policies using auth.uid() and tenant lookup
CREATE POLICY "Tenant project_regions access" ON public.project_regions
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Tenant project_users access" ON public.project_users
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Tenant projects access" ON public.projects
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Tenant personnel access" ON public.personnel
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Tenant checkpoints access" ON public.checkpoints
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Tenant patrols access" ON public.patrols
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users 
      WHERE id = auth.uid()
    )
  );

CREATE POLICY "Tenant incidents access" ON public.incidents
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM public.users 
      WHERE id = auth.uid()
    )
  );
