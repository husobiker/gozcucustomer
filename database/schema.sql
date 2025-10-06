-- SafeBase Multi-Tenant Database Schema

-- Enable Row Level Security

-- Create tenants table (SaaS customers)
CREATE TABLE public.tenants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL, -- "ABC Güvenlik"
  subdomain TEXT UNIQUE NOT NULL, -- "abcguvenlik"
  subscription_plan TEXT DEFAULT 'basic' CHECK (subscription_plan IN ('basic', 'pro', 'enterprise')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled', 'trial')),
  max_users INTEGER DEFAULT 5,
  max_projects INTEGER DEFAULT 2,
  max_personnel INTEGER DEFAULT 20,
  max_checkpoints INTEGER DEFAULT 50,
  branding JSONB DEFAULT '{}', -- logo, colors, theme settings
  settings JSONB DEFAULT '{}', -- tenant-specific settings
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  last_payment_at TIMESTAMP WITH TIME ZONE,
  next_payment_at TIMESTAMP WITH TIME ZONE
);

-- Create users table (extends auth.users) - now tenant-aware
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'moderator')),
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(tenant_id, email) -- Email unique per tenant
);

-- Create admin_profiles table for admin-specific data
CREATE TABLE public.admin_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  admin_level TEXT DEFAULT 'basic' CHECK (admin_level IN ('basic', 'super', 'owner')),
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create projects table - tenant-aware
CREATE TABLE public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- Create project_users table - tenant-aware (many-to-many relationship)
CREATE TABLE public.project_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_id) -- Prevent duplicate assignments
);

-- Create personnel table - tenant-aware
CREATE TABLE public.personnel (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  mobile_login_username TEXT NOT NULL,
  mobile_login_pin TEXT NOT NULL,
  mobile_version_system TEXT CHECK (mobile_version_system IN ('ios', 'android')),
  mobile_version_version TEXT,
  status TEXT DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Pasif')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create checkpoints table - tenant-aware
CREATE TABLE public.checkpoints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  type TEXT DEFAULT 'QR Kod' CHECK (type IN ('QR Kod', 'NFC', 'GPS')),
  project_region TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create patrols table - tenant-aware
CREATE TABLE public.patrols (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  task_name TEXT NOT NULL,
  personnel_id UUID REFERENCES public.personnel(id) ON DELETE SET NULL,
  repetition TEXT DEFAULT 'Günlük',
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  color TEXT DEFAULT '#2196f3',
  type TEXT DEFAULT 'shared' CHECK (type IN ('shared', 'individual')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'completed', 'missed')),
  scheduled_date DATE NOT NULL,
  completed_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create incidents table - tenant-aware
CREATE TABLE public.incidents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  serial_no INTEGER NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved', 'closed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  creation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responsible_person TEXT,
  description TEXT NOT NULL,
  location TEXT,
  documents TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create system_settings table
CREATE TABLE public.system_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create audit_logs table for tracking admin actions
CREATE TABLE public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_created_at ON public.users(created_at);
CREATE INDEX idx_audit_logs_admin_id ON public.audit_logs(admin_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);

-- Enable Row Level Security
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patrols ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tenants table
CREATE POLICY "Tenants can view their own data" ON public.tenants
  FOR SELECT USING (id = current_setting('app.current_tenant_id')::uuid);

-- RLS Policies for users table - tenant-aware
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view same tenant users" ON public.users
  FOR SELECT USING (
    tenant_id = current_setting('app.current_tenant_id')::uuid
  );

CREATE POLICY "Admins can update same tenant users" ON public.users
  FOR UPDATE USING (
    tenant_id = current_setting('app.current_tenant_id')::uuid AND
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin' AND tenant_id = current_setting('app.current_tenant_id')::uuid
    )
  );

-- RLS Policies for projects table
CREATE POLICY "Tenant projects access" ON public.projects
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- RLS Policies for project_regions table
CREATE POLICY "Tenant project_regions access" ON public.project_regions
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- RLS Policies for project_users table
CREATE POLICY "Tenant project_users access" ON public.project_users
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- RLS Policies for personnel table
CREATE POLICY "Tenant personnel access" ON public.personnel
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- RLS Policies for checkpoints table
CREATE POLICY "Tenant checkpoints access" ON public.checkpoints
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- RLS Policies for patrols table
CREATE POLICY "Tenant patrols access" ON public.patrols
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- RLS Policies for incidents table
CREATE POLICY "Tenant incidents access" ON public.incidents
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- RLS Policies for admin_profiles table
CREATE POLICY "Tenant admin profiles access" ON public.admin_profiles
  FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- RLS Policies for system_settings table
CREATE POLICY "Admins can manage system settings" ON public.system_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for audit_logs table
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

-- Function to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  
  -- If user is admin, create admin profile
  IF COALESCE(NEW.raw_user_meta_data->>'role', 'user') = 'admin' THEN
    INSERT INTO public.admin_profiles (id, admin_level)
    VALUES (NEW.id, 'basic');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_admin_profiles_updated_at
  BEFORE UPDATE ON public.admin_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to set tenant context for RLS
CREATE OR REPLACE FUNCTION public.set_tenant_context(tenant_id UUID)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_tenant_id', tenant_id::text, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current tenant context
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS UUID AS $$
BEGIN
  RETURN current_setting('app.current_tenant_id')::uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default system settings
INSERT INTO public.system_settings (key, value, description) VALUES
('app_name', '"SafeBase"', 'Application name'),
('maintenance_mode', 'false', 'Maintenance mode status'),
('max_users', '1000', 'Maximum number of users'),
('session_timeout', '3600', 'Session timeout in seconds'),
('notifications_enabled', 'true', 'Global notifications status');

-- Insert sample tenants for testing
INSERT INTO public.tenants (id, name, subdomain, subscription_plan, status, max_users, max_projects, max_personnel, max_checkpoints, branding) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'ABC Güvenlik', 'abcguvenlik', 'pro', 'active', 25, 10, 100, 500, '{"company_name": "ABC Güvenlik", "primary_color": "#1976d2", "secondary_color": "#dc004e"}'),
('550e8400-e29b-41d4-a716-446655440002', 'XYZ Güvenlik', 'xyzguvenlik', 'basic', 'active', 5, 2, 20, 50, '{"company_name": "XYZ Güvenlik", "primary_color": "#2e7d32", "secondary_color": "#ff9800"}');

-- Insert a default admin user (you'll need to create this user in Supabase Auth first)
-- This is just a placeholder - the actual user will be created through the auth system
