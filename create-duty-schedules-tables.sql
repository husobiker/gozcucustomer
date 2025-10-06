-- Nöbet çizelgesi yönetimi tabloları

-- Nöbet çizelgeleri tablosu
CREATE TABLE IF NOT EXISTS duty_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2030),
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    published_at TIMESTAMP WITH TIME ZONE,
    published_by UUID REFERENCES auth.users(id)
);

-- Nöbet atamaları tablosu
CREATE TABLE IF NOT EXISTS duty_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID NOT NULL REFERENCES duty_schedules(id) ON DELETE CASCADE,
    personnel_id UUID NOT NULL REFERENCES personnel(id) ON DELETE CASCADE,
    duty_date DATE NOT NULL,
    shift_type VARCHAR(20) NOT NULL DEFAULT 'day' CHECK (shift_type IN ('day', 'night', 'full')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_holiday BOOLEAN DEFAULT false,
    is_weekend BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Nöbet değişim talepleri tablosu
CREATE TABLE IF NOT EXISTS duty_swap_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_assignment_id UUID NOT NULL REFERENCES duty_assignments(id) ON DELETE CASCADE,
    to_assignment_id UUID NOT NULL REFERENCES duty_assignments(id) ON DELETE CASCADE,
    requester_id UUID NOT NULL REFERENCES auth.users(id),
    reason TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Nöbet şablonları tablosu
CREATE TABLE IF NOT EXISTS duty_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Nöbet şablon atamaları tablosu
CREATE TABLE IF NOT EXISTS duty_template_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES duty_templates(id) ON DELETE CASCADE,
    personnel_id UUID NOT NULL REFERENCES personnel(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Pazar, 6=Cumartesi
    shift_type VARCHAR(20) NOT NULL DEFAULT 'day',
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_holiday BOOLEAN DEFAULT false,
    is_weekend BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS politikaları
ALTER TABLE duty_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE duty_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE duty_swap_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE duty_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE duty_template_assignments ENABLE ROW LEVEL SECURITY;

-- Super admin için tüm nöbet verilerini görme yetkisi
CREATE POLICY "Super admin can view all duty schedules" ON duty_schedules
    FOR ALL USING (true);

CREATE POLICY "Super admin can view all duty assignments" ON duty_assignments
    FOR ALL USING (true);

CREATE POLICY "Super admin can view all duty swap requests" ON duty_swap_requests
    FOR ALL USING (true);

CREATE POLICY "Super admin can view all duty templates" ON duty_templates
    FOR ALL USING (true);

CREATE POLICY "Super admin can view all duty template assignments" ON duty_template_assignments
    FOR ALL USING (true);

-- Tenant bazlı erişim politikaları
CREATE POLICY "Tenant users can view their duty schedules" ON duty_schedules
    FOR SELECT USING (tenant_id IN (
        SELECT id FROM tenants WHERE id = auth.jwt() ->> 'tenant_id'
    ));

CREATE POLICY "Tenant users can view their duty assignments" ON duty_assignments
    FOR SELECT USING (schedule_id IN (
        SELECT id FROM duty_schedules WHERE tenant_id = auth.jwt() ->> 'tenant_id'
    ));

CREATE POLICY "Tenant users can view their duty swap requests" ON duty_swap_requests
    FOR SELECT USING (requester_id = auth.uid());

CREATE POLICY "Tenant users can view their duty templates" ON duty_templates
    FOR SELECT USING (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Tenant users can view their duty template assignments" ON duty_template_assignments
    FOR SELECT USING (template_id IN (
        SELECT id FROM duty_templates WHERE tenant_id = auth.jwt() ->> 'tenant_id'
    ));

-- Indexler
CREATE INDEX IF NOT EXISTS idx_duty_schedules_tenant_id ON duty_schedules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_duty_schedules_project_id ON duty_schedules(project_id);
CREATE INDEX IF NOT EXISTS idx_duty_schedules_month_year ON duty_schedules(month, year);
CREATE INDEX IF NOT EXISTS idx_duty_schedules_status ON duty_schedules(status);

CREATE INDEX IF NOT EXISTS idx_duty_assignments_schedule_id ON duty_assignments(schedule_id);
CREATE INDEX IF NOT EXISTS idx_duty_assignments_personnel_id ON duty_assignments(personnel_id);
CREATE INDEX IF NOT EXISTS idx_duty_assignments_duty_date ON duty_assignments(duty_date);
CREATE INDEX IF NOT EXISTS idx_duty_assignments_shift_type ON duty_assignments(shift_type);

CREATE INDEX IF NOT EXISTS idx_duty_swap_requests_from_assignment ON duty_swap_requests(from_assignment_id);
CREATE INDEX IF NOT EXISTS idx_duty_swap_requests_to_assignment ON duty_swap_requests(to_assignment_id);
CREATE INDEX IF NOT EXISTS idx_duty_swap_requests_requester ON duty_swap_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_duty_swap_requests_status ON duty_swap_requests(status);

CREATE INDEX IF NOT EXISTS idx_duty_templates_tenant_id ON duty_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_duty_templates_project_id ON duty_templates(project_id);
CREATE INDEX IF NOT EXISTS idx_duty_templates_active ON duty_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_duty_template_assignments_template_id ON duty_template_assignments(template_id);
CREATE INDEX IF NOT EXISTS idx_duty_template_assignments_personnel_id ON duty_template_assignments(personnel_id);
CREATE INDEX IF NOT EXISTS idx_duty_template_assignments_day ON duty_template_assignments(day_of_week);

-- Trigger fonksiyonları
CREATE OR REPLACE FUNCTION update_duty_schedules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_duty_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_duty_swap_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_duty_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger'lar
CREATE TRIGGER update_duty_schedules_updated_at
    BEFORE UPDATE ON duty_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_duty_schedules_updated_at();

CREATE TRIGGER update_duty_assignments_updated_at
    BEFORE UPDATE ON duty_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_duty_assignments_updated_at();

CREATE TRIGGER update_duty_swap_requests_updated_at
    BEFORE UPDATE ON duty_swap_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_duty_swap_requests_updated_at();

CREATE TRIGGER update_duty_templates_updated_at
    BEFORE UPDATE ON duty_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_duty_templates_updated_at();

-- Nöbet çizelgesi oluşturma fonksiyonu
CREATE OR REPLACE FUNCTION create_duty_schedule_from_template(
    template_id_param UUID,
    month_param INTEGER,
    year_param INTEGER,
    tenant_id_param UUID,
    project_id_param UUID
)
RETURNS UUID AS $$
DECLARE
    schedule_id UUID;
    template_assignment RECORD;
    days_in_month INTEGER;
    current_date DATE;
    duty_date DATE;
    day_of_week INTEGER;
BEGIN
    -- Nöbet çizelgesi oluştur
    INSERT INTO duty_schedules (
        tenant_id,
        project_id,
        month,
        year,
        status,
        created_by
    ) VALUES (
        tenant_id_param,
        project_id_param,
        month_param,
        year_param,
        'draft',
        auth.uid()
    ) RETURNING id INTO schedule_id;
    
    -- Ayın gün sayısını hesapla
    days_in_month := EXTRACT(DAY FROM (DATE_TRUNC('month', 
        MAKE_DATE(year_param, month_param, 1) + INTERVAL '1 month') - INTERVAL '1 day'));
    
    -- Her gün için şablon atamalarını uygula
    FOR current_date IN 
        SELECT generate_series(
            MAKE_DATE(year_param, month_param, 1),
            MAKE_DATE(year_param, month_param, days_in_month),
            '1 day'::interval
        )::date
    LOOP
        day_of_week := EXTRACT(DOW FROM current_date);
        
        -- Bu gün için şablon atamalarını bul
        FOR template_assignment IN
            SELECT *
            FROM duty_template_assignments
            WHERE template_id = template_id_param
            AND day_of_week = day_of_week
        LOOP
            -- Nöbet ataması oluştur
            INSERT INTO duty_assignments (
                schedule_id,
                personnel_id,
                duty_date,
                shift_type,
                start_time,
                end_time,
                is_holiday,
                is_weekend,
                created_by
            ) VALUES (
                schedule_id,
                template_assignment.personnel_id,
                current_date,
                template_assignment.shift_type,
                template_assignment.start_time,
                template_assignment.end_time,
                template_assignment.is_holiday,
                template_assignment.is_weekend,
                auth.uid()
            );
        END LOOP;
    END LOOP;
    
    RETURN schedule_id;
END;
$$ LANGUAGE plpgsql;
