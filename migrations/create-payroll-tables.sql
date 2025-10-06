-- Puantaj ve maaş yönetimi tabloları

-- Puantaj kayıtları tablosu
CREATE TABLE IF NOT EXISTS payroll_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    personnel_id UUID NOT NULL REFERENCES personnel(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
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
CREATE TABLE IF NOT EXISTS salary_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_record_id UUID NOT NULL REFERENCES payroll_records(id) ON DELETE CASCADE,
    component_type VARCHAR(50) NOT NULL CHECK (component_type IN ('base_salary', 'overtime', 'holiday', 'bonus', 'allowance', 'deduction', 'tax', 'insurance')),
    component_name VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    is_addition BOOLEAN NOT NULL DEFAULT true, -- true: ekleme, false: kesinti
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Maaş şablonları tablosu
CREATE TABLE IF NOT EXISTS salary_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Maaş şablon kalemleri tablosu
CREATE TABLE IF NOT EXISTS salary_template_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES salary_templates(id) ON DELETE CASCADE,
    component_type VARCHAR(50) NOT NULL,
    component_name VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    is_percentage BOOLEAN DEFAULT false,
    is_addition BOOLEAN NOT NULL DEFAULT true,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS politikaları
ALTER TABLE payroll_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_template_components ENABLE ROW LEVEL SECURITY;

-- Super admin için tüm puantaj verilerini görme yetkisi
CREATE POLICY "Super admin can view all payroll records" ON payroll_records
    FOR ALL USING (true);

CREATE POLICY "Super admin can view all salary components" ON salary_components
    FOR ALL USING (true);

CREATE POLICY "Super admin can view all salary templates" ON salary_templates
    FOR ALL USING (true);

CREATE POLICY "Super admin can view all salary template components" ON salary_template_components
    FOR ALL USING (true);

-- Tenant bazlı erişim politikaları
CREATE POLICY "Tenant users can view their payroll records" ON payroll_records
    FOR SELECT USING (tenant_id IN (
        SELECT id FROM tenants WHERE id = auth.jwt() ->> 'tenant_id'
    ));

CREATE POLICY "Tenant users can view their salary components" ON salary_components
    FOR SELECT USING (payroll_record_id IN (
        SELECT id FROM payroll_records WHERE tenant_id = auth.jwt() ->> 'tenant_id'
    ));

CREATE POLICY "Tenant users can view their salary templates" ON salary_templates
    FOR SELECT USING (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Tenant users can view their salary template components" ON salary_template_components
    FOR SELECT USING (template_id IN (
        SELECT id FROM salary_templates WHERE tenant_id = auth.jwt() ->> 'tenant_id'
    ));

-- Indexler
CREATE INDEX IF NOT EXISTS idx_payroll_records_personnel_id ON payroll_records(personnel_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_tenant_id ON payroll_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_project_id ON payroll_records(project_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_month_year ON payroll_records(month, year);
CREATE INDEX IF NOT EXISTS idx_payroll_records_status ON payroll_records(status);
CREATE INDEX IF NOT EXISTS idx_payroll_records_created_at ON payroll_records(created_at);

CREATE INDEX IF NOT EXISTS idx_salary_components_payroll_record_id ON salary_components(payroll_record_id);
CREATE INDEX IF NOT EXISTS idx_salary_components_type ON salary_components(component_type);

CREATE INDEX IF NOT EXISTS idx_salary_templates_tenant_id ON salary_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_salary_templates_active ON salary_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_salary_template_components_template_id ON salary_template_components(template_id);
CREATE INDEX IF NOT EXISTS idx_salary_template_components_order ON salary_template_components(order_index);

-- Trigger fonksiyonları
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

-- Trigger'lar
CREATE TRIGGER update_payroll_records_updated_at
    BEFORE UPDATE ON payroll_records
    FOR EACH ROW
    EXECUTE FUNCTION update_payroll_records_updated_at();

CREATE TRIGGER update_salary_templates_updated_at
    BEFORE UPDATE ON salary_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_salary_templates_updated_at();

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
    FROM personnel
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
    INSERT INTO payroll_records (
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
