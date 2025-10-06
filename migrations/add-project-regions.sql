-- Add project_regions table to existing database
-- Run this in Supabase SQL Editor

-- Create project_regions table - tenant-aware
CREATE TABLE public.project_regions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  country TEXT,
  city TEXT,
  district TEXT,
  postal_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for project_regions
ALTER TABLE public.project_regions ENABLE ROW LEVEL SECURITY;

-- Create RLS Policy for project_regions table
CREATE POLICY "Tenant project_regions access" ON public.project_regions
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Create indexes for better performance
CREATE INDEX idx_project_regions_tenant_id ON public.project_regions(tenant_id);
CREATE INDEX idx_project_regions_project_id ON public.project_regions(project_id);
CREATE INDEX idx_project_regions_created_at ON public.project_regions(created_at);
