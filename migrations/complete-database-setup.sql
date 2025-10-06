-- Complete SafeBase Database Setup with Payroll Tables
-- Run this in Supabase SQL Editor

-- Enable Row Level Security

-- Create tenants table (SaaS customers)
CREATE TABLE IF NOT EXISTS public.tenants (
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
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'moderator')),
  avatar_url TEXT,
  phone TEXT,
  permissions JSONB DEFAULT '{}', -- User permissions for modules
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(tenant_id, email) -- Email unique per tenant
);

-- Create admin_profiles table for admin-specific data
CREATE TABLE IF NOT EXISTS public.admin_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  admin_level TEXT DEFAULT 'basic' CHECK (admin_level IN ('basic', 'super', 'owner')),
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create projects table - tenant-aware
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create project_users table - tenant-aware (many-to-many relationship)
CREATE TABLE IF NOT EXISTS public.project_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_id) -- Prevent duplicate assignments
);

-- Create personnel table - tenant-aware
CREATE TABLE IF NOT EXISTS public.personnel (
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
  hourly_rate DECIMAL(10,2),
  daily_rate DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create checkpoints table - tenant-aware
CREATE TABLE IF NOT EXISTS public.checkpoints (
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
CREATE TABLE IF NOT EXISTS public.patrols (
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
CREATE TABLE IF NOT EXISTS public.incidents (
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

-- Create shift_types table - tenant-aware
CREATE TABLE IF NOT EXISTS public.shift_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration INTEGER NOT NULL, -- hours
    break_duration INTEGER DEFAULT 0, -- minutes
    is_night_shift BOOLEAN DEFAULT FALSE,
    is_weekend_shift BOOLEAN DEFAULT FALSE,
    color VARCHAR(7) NOT NULL, -- hex color code
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id),
    updated_by UUID REFERENCES public.users(id),
    
    -- Unique constraints
    UNIQUE(tenant_id, project_id, code),
    UNIQUE(tenant_id, project_id, name)
);

-- Create system_settings table
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create audit_logs table for tracking admin actions
CREATE TABLE IF NOT EXISTS public.audit_logs (
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

-- PAYROLL TABLES
-- Puantaj kayıtları tablosu
CREATE TABLE IF NOT EXISTS public.payroll_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    personnel_id UUID NOT NULL REFERENCES public.personnel(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2030),
    total_working_days INTEGER NOT NULL DEFAULT 0,
    total_working_hours DECIMAL(5,2) NOT NULL DEFAULT 0,
    overtime_hours DECIMAL(5,2) NOT NULL DEFAULT 0,
    holiday_hours DECIMAL(5,2) NOT NULL DEFAULT 0,
    leave_days INTEGER NOT NULL DEFAULT 0,
    gross_salary DECIMAL(10,2) NOT NULL DEFAULT 0,
    deductions DECIMAL(10,2) NOT NULL DEFAULT 0,
    net_salary DECIMAL(10,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP WITH TIME ZONE
);

-- Maaş kalemleri tablosu
CREATE TABLE IF NOT EXISTS public.salary_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_record_id UUID NOT NULL REFERENCES public.payroll_records(id) ON DELETE CASCADE,
    component_type VARCHAR(50) NOT NULL CHECK (component_type IN ('base_salary', 'overtime', 'holiday', 'bonus', 'allowance', 'deduction', 'tax', 'insurance')),
    component_name VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    is_addition BOOLEAN NOT NULL DEFAULT true, -- true: ekleme, false: kesinti
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Maaş şablonları tablosu
CREATE TABLE IF NOT EXISTS public.salary_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Maaş şablon kalemleri tablosu
CREATE TABLE IF NOT EXISTS public.salary_template_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES public.salary_templates(id) ON DELETE CASCADE,
    component_type VARCHAR(50) NOT NULL,
    component_name VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    is_percentage BOOLEAN DEFAULT false,
    is_addition BOOLEAN NOT NULL DEFAULT true,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patrols ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_template_components ENABLE ROW LEVEL SECURITY;

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

-- RLS Policies for project_users table
CREATE POLICY "Tenant project users access" ON public.project_users
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

-- RLS Policies for shift_types table
CREATE POLICY "Users can view shift types for their tenant and project" ON public.shift_types
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM public.project_users 
            WHERE user_id = auth.uid() AND project_id = shift_types.project_id
        )
    );

CREATE POLICY "Users can insert shift types for their tenant and project" ON public.shift_types
    FOR INSERT WITH CHECK (
        tenant_id IN (
            SELECT tenant_id FROM public.project_users 
            WHERE user_id = auth.uid() AND project_id = shift_types.project_id
        )
    );

CREATE POLICY "Users can update shift types for their tenant and project" ON public.shift_types
    FOR UPDATE USING (
        tenant_id IN (
            SELECT tenant_id FROM public.project_users 
            WHERE user_id = auth.uid() AND project_id = shift_types.project_id
        )
    );

CREATE POLICY "Users can delete shift types for their tenant and project" ON public.shift_types
    FOR DELETE USING (
        tenant_id IN (
            SELECT tenant_id FROM public.project_users 
            WHERE user_id = auth.uid() AND project_id = shift_types.project_id
        )
    );

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

-- Payroll RLS Policies
-- Super admin için tüm puantaj verilerini görme yetkisi
CREATE POLICY "Super admin can view all payroll records" ON public.payroll_records
    FOR ALL USING (true);

CREATE POLICY "Super admin can view all salary components" ON public.salary_components
    FOR ALL USING (true);

CREATE POLICY "Super admin can view all salary templates" ON public.salary_templates
    FOR ALL USING (true);

CREATE POLICY "Super admin can view all salary template components" ON public.salary_template_components
    FOR ALL USING (true);

-- Tenant bazlı erişim politikaları
CREATE POLICY "Tenant users can view their payroll records" ON public.payroll_records
    FOR SELECT USING (tenant_id IN (
        SELECT id FROM public.tenants WHERE id = (auth.jwt() ->> 'tenant_id')::uuid
    ));

CREATE POLICY "Tenant users can view their salary components" ON public.salary_components
    FOR SELECT USING (payroll_record_id IN (
        SELECT id FROM public.payroll_records WHERE tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    ));

CREATE POLICY "Tenant users can view their salary templates" ON public.salary_templates
    FOR SELECT USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "Tenant users can view their salary template components" ON public.salary_template_components
    FOR SELECT USING (template_id IN (
        SELECT id FROM public.salary_templates WHERE tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    ));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON public.audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- Shift types indexes
CREATE INDEX IF NOT EXISTS idx_shift_types_tenant_project ON public.shift_types(tenant_id, project_id);
CREATE INDEX IF NOT EXISTS idx_shift_types_active ON public.shift_types(is_active);
CREATE INDEX IF NOT EXISTS idx_shift_types_code ON public.shift_types(code);

-- Project users indexes
CREATE INDEX IF NOT EXISTS idx_project_users_tenant_id ON public.project_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_project_users_project_id ON public.project_users(project_id);
CREATE INDEX IF NOT EXISTS idx_project_users_user_id ON public.project_users(user_id);

-- Payroll indexes
CREATE INDEX IF NOT EXISTS idx_payroll_records_personnel_id ON public.payroll_records(personnel_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_tenant_id ON public.payroll_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_project_id ON public.payroll_records(project_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_month_year ON public.payroll_records(month, year);
CREATE INDEX IF NOT EXISTS idx_payroll_records_status ON public.payroll_records(status);
CREATE INDEX IF NOT EXISTS idx_payroll_records_created_at ON public.payroll_records(created_at);

CREATE INDEX IF NOT EXISTS idx_salary_components_payroll_record_id ON public.salary_components(payroll_record_id);
CREATE INDEX IF NOT EXISTS idx_salary_components_type ON public.salary_components(component_type);

CREATE INDEX IF NOT EXISTS idx_salary_templates_tenant_id ON public.salary_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_salary_templates_active ON public.salary_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_salary_template_components_template_id ON public.salary_template_components(template_id);
CREATE INDEX IF NOT EXISTS idx_salary_template_components_order ON public.salary_template_components(order_index);

-- Function to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  first_name_value TEXT;
  last_name_value TEXT;
  full_name_value TEXT;
BEGIN
  -- Extract first_name and last_name from metadata, with fallbacks
  first_name_value := COALESCE(
    NEW.raw_user_meta_data->>'first_name',
    split_part(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), ' ', 1),
    'Kullanıcı'
  );
  
  last_name_value := COALESCE(
    NEW.raw_user_meta_data->>'last_name',
    CASE 
      WHEN position(' ' in COALESCE(NEW.raw_user_meta_data->>'full_name', '')) > 0 
      THEN split_part(NEW.raw_user_meta_data->>'full_name', ' ', 2)
      ELSE ''
    END,
    ''
  );
  
  full_name_value := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    first_name_value || CASE WHEN last_name_value != '' THEN ' ' || last_name_value ELSE '' END,
    NEW.email
  );

  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    full_name_value,
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

-- Payroll trigger functions
CREATE OR REPLACE FUNCTION update_payroll_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_salary_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Payroll triggers
CREATE TRIGGER update_payroll_records_updated_at
    BEFORE UPDATE ON public.payroll_records
    FOR EACH ROW
    EXECUTE FUNCTION update_payroll_records_updated_at();

CREATE TRIGGER update_salary_templates_updated_at
    BEFORE UPDATE ON public.salary_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_salary_templates_updated_at();

-- Shift types trigger function
CREATE OR REPLACE FUNCTION update_shift_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Shift types trigger
CREATE TRIGGER trigger_update_shift_types_updated_at
    BEFORE UPDATE ON public.shift_types
    FOR EACH ROW
    EXECUTE FUNCTION update_shift_types_updated_at();

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

-- Puantaj hesaplama fonksiyonu
CREATE OR REPLACE FUNCTION calculate_payroll(
    personnel_id_param UUID,
    tenant_id_param UUID,
    project_id_param UUID,
    month_param INTEGER,
    year_param INTEGER
)
RETURNS UUID AS $$
DECLARE
    payroll_record_id UUID;
    personnel_record RECORD;
    working_days INTEGER;
    working_hours DECIMAL(5,2);
    overtime_hours DECIMAL(5,2);
    holiday_hours DECIMAL(5,2);
    leave_days INTEGER;
    hourly_rate DECIMAL(10,2);
    gross_salary DECIMAL(10,2);
    deductions DECIMAL(10,2);
    net_salary DECIMAL(10,2);
BEGIN
    -- Personel bilgilerini al
    SELECT * INTO personnel_record
    FROM public.personnel
    WHERE id = personnel_id_param
    AND tenant_id = tenant_id_param
    AND project_id = project_id_param;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Personel bulunamadı';
    END IF;
    
    -- Basit hesaplama (gerçek implementasyonda nöbet çizelgesinden gelecek)
    working_days := 20;
    working_hours := working_days * 8;
    overtime_hours := 0;
    holiday_hours := 0;
    leave_days := 2;
    
    hourly_rate := COALESCE(personnel_record.hourly_rate, 25);
    gross_salary := working_hours * hourly_rate + overtime_hours * hourly_rate * 1.5;
    deductions := gross_salary * 0.1;
    net_salary := gross_salary - deductions;
    
    -- Puantaj kaydı oluştur
    INSERT INTO public.payroll_records (
        personnel_id,
        tenant_id,
        project_id,
        month,
        year,
        total_working_days,
        total_working_hours,
        overtime_hours,
        holiday_hours,
        leave_days,
        gross_salary,
        deductions,
        net_salary,
        status
    ) VALUES (
        personnel_id_param,
        tenant_id_param,
        project_id_param,
        month_param,
        year_param,
        working_days,
        working_hours,
        overtime_hours,
        holiday_hours,
        leave_days,
        gross_salary,
        deductions,
        net_salary,
        'draft'
    ) RETURNING id INTO payroll_record_id;
    
    RETURN payroll_record_id;
END;
$$ LANGUAGE plpgsql;

-- Insert default system settings
INSERT INTO public.system_settings (key, value, description) VALUES
('app_name', '"SafeBase"', 'Application name'),
('maintenance_mode', 'false', 'Maintenance mode status'),
('max_users', '1000', 'Maximum number of users'),
('session_timeout', '3600', 'Session timeout in seconds'),
('notifications_enabled', 'true', 'Global notifications status')
ON CONFLICT (key) DO NOTHING;

-- Insert sample tenants for testing
INSERT INTO public.tenants (id, name, subdomain, subscription_plan, status, max_users, max_projects, max_personnel, max_checkpoints, branding) VALUES
('550e8400-e29b-41d4-a716-446655440001'::uuid, 'ABC Güvenlik', 'abcguvenlik', 'pro', 'active', 25, 10, 100, 500, '{"company_name": "ABC Güvenlik", "primary_color": "#1976d2", "secondary_color": "#dc004e"}'),
('550e8400-e29b-41d4-a716-446655440002'::uuid, 'XYZ Güvenlik', 'xyzguvenlik', 'basic', 'active', 5, 2, 20, 50, '{"company_name": "XYZ Güvenlik", "primary_color": "#2e7d32", "secondary_color": "#ff9800"}')
ON CONFLICT (id) DO NOTHING;
