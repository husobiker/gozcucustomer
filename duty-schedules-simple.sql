-- Nöbet çizelgeleri tablosu - Basit versiyon
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

-- RLS politikaları
ALTER TABLE duty_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE duty_assignments ENABLE ROW LEVEL SECURITY;

-- RLS politikaları oluştur
CREATE POLICY "Users can view duty schedules for their tenant" ON duty_schedules
    FOR SELECT USING (tenant_id IN (
        SELECT tenant_id FROM users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can insert duty schedules for their tenant" ON duty_schedules
    FOR INSERT WITH CHECK (tenant_id IN (
        SELECT tenant_id FROM users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can update duty schedules for their tenant" ON duty_schedules
    FOR UPDATE USING (tenant_id IN (
        SELECT tenant_id FROM users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can delete duty schedules for their tenant" ON duty_schedules
    FOR DELETE USING (tenant_id IN (
        SELECT tenant_id FROM users WHERE id = auth.uid()
    ));

CREATE POLICY "Users can view duty assignments for their tenant" ON duty_assignments
    FOR SELECT USING (schedule_id IN (
        SELECT id FROM duty_schedules WHERE tenant_id IN (
            SELECT tenant_id FROM users WHERE id = auth.uid()
        )
    ));

CREATE POLICY "Users can insert duty assignments for their tenant" ON duty_assignments
    FOR INSERT WITH CHECK (schedule_id IN (
        SELECT id FROM duty_schedules WHERE tenant_id IN (
            SELECT tenant_id FROM users WHERE id = auth.uid()
        )
    ));

CREATE POLICY "Users can update duty assignments for their tenant" ON duty_assignments
    FOR UPDATE USING (schedule_id IN (
        SELECT id FROM duty_schedules WHERE tenant_id IN (
            SELECT tenant_id FROM users WHERE id = auth.uid()
        )
    ));

CREATE POLICY "Users can delete duty assignments for their tenant" ON duty_assignments
    FOR DELETE USING (schedule_id IN (
        SELECT id FROM duty_schedules WHERE tenant_id IN (
            SELECT tenant_id FROM users WHERE id = auth.uid()
        )
    ));
