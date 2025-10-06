-- Joker Personel Hesaplama tablosu
-- Yıllık 270 saat mesai limiti aşımında joker personel ihtiyacı hesaplama

CREATE TABLE IF NOT EXISTS joker_calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Hesaplama dönemi
    calculation_year INTEGER NOT NULL CHECK (calculation_year >= 2020 AND calculation_year <= 2030),
    calculation_month INTEGER NOT NULL CHECK (calculation_month >= 1 AND calculation_month <= 12),
    
    -- Personel bilgileri
    personnel_id UUID NOT NULL REFERENCES personnel(id) ON DELETE CASCADE,
    
    -- Çalışma saatleri
    total_working_hours DECIMAL(8,2) NOT NULL DEFAULT 0, -- Toplam çalışma saati
    legal_monthly_hours DECIMAL(8,2) NOT NULL DEFAULT 195, -- Yasal aylık saat (195)
    legal_yearly_hours DECIMAL(8,2) NOT NULL DEFAULT 2340, -- Yasal yıllık saat (195*12)
    legal_yearly_overtime DECIMAL(8,2) NOT NULL DEFAULT 270, -- Yasal yıllık mesai (270)
    
    -- Mesai hesaplamaları
    monthly_overtime DECIMAL(8,2) NOT NULL DEFAULT 0, -- Aylık mesai
    yearly_overtime DECIMAL(8,2) NOT NULL DEFAULT 0, -- Yıllık mesai
    excess_overtime DECIMAL(8,2) NOT NULL DEFAULT 0, -- Limit aşımı
    
    -- Joker ihtiyacı
    joker_hours_needed DECIMAL(8,2) NOT NULL DEFAULT 0, -- Gerekli joker saati
    joker_days_needed DECIMAL(8,2) NOT NULL DEFAULT 0, -- Gerekli joker günü
    joker_cost_estimate DECIMAL(10,2) NOT NULL DEFAULT 0, -- Tahmini joker maliyeti
    
    -- Durum
    status VARCHAR(20) NOT NULL DEFAULT 'calculated' CHECK (status IN (
        'calculated',    -- Hesaplandı
        'approved',       -- Onaylandı
        'joker_assigned', -- Joker atandı
        'completed'       -- Tamamlandı
    )),
    
    -- Joker atama bilgileri
    assigned_joker_id UUID REFERENCES joker_personnel(id),
    assigned_date DATE,
    assigned_hours DECIMAL(8,2) DEFAULT 0,
    
    -- Notlar
    notes TEXT,
    admin_notes TEXT,
    
    -- Sistem bilgileri
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    
    -- Kısıtlamalar
    CONSTRAINT valid_hours CHECK (total_working_hours >= 0),
    CONSTRAINT valid_overtime CHECK (monthly_overtime >= 0 AND yearly_overtime >= 0),
    CONSTRAINT valid_joker_needs CHECK (joker_hours_needed >= 0 AND joker_days_needed >= 0),
    CONSTRAINT valid_cost CHECK (joker_cost_estimate >= 0)
);

-- RLS politikaları
ALTER TABLE joker_calculations ENABLE ROW LEVEL SECURITY;

-- Super admin için tüm joker hesaplama verilerini görme yetkisi
CREATE POLICY "Super admin can view all joker calculations" ON joker_calculations
    FOR ALL USING (true);

-- Tenant bazlı erişim politikaları
CREATE POLICY "Tenant users can view their joker calculations" ON joker_calculations
    FOR SELECT USING (tenant_id IN (
        SELECT id FROM tenants WHERE id = (auth.jwt() ->> 'tenant_id')::uuid
    ));

CREATE POLICY "Tenant users can insert joker calculations" ON joker_calculations
    FOR INSERT WITH CHECK (tenant_id IN (
        SELECT id FROM tenants WHERE id = (auth.jwt() ->> 'tenant_id')::uuid
    ));

CREATE POLICY "Tenant users can update joker calculations" ON joker_calculations
    FOR UPDATE USING (tenant_id IN (
        SELECT id FROM tenants WHERE id = (auth.jwt() ->> 'tenant_id')::uuid
    ));

CREATE POLICY "Tenant users can delete joker calculations" ON joker_calculations
    FOR DELETE USING (tenant_id IN (
        SELECT id FROM tenants WHERE id = (auth.jwt() ->> 'tenant_id')::uuid
    ));

-- Indexler
CREATE INDEX IF NOT EXISTS idx_joker_calculations_tenant_id ON joker_calculations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_joker_calculations_project_id ON joker_calculations(project_id);
CREATE INDEX IF NOT EXISTS idx_joker_calculations_personnel_id ON joker_calculations(personnel_id);
CREATE INDEX IF NOT EXISTS idx_joker_calculations_year_month ON joker_calculations(calculation_year, calculation_month);
CREATE INDEX IF NOT EXISTS idx_joker_calculations_status ON joker_calculations(status);
CREATE INDEX IF NOT EXISTS idx_joker_calculations_excess_overtime ON joker_calculations(excess_overtime);

-- Trigger fonksiyonu
CREATE OR REPLACE FUNCTION update_joker_calculations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER update_joker_calculations_updated_at
    BEFORE UPDATE ON joker_calculations
    FOR EACH ROW
    EXECUTE FUNCTION update_joker_calculations_updated_at();

-- Joker hesaplama fonksiyonu
CREATE OR REPLACE FUNCTION calculate_joker_needs(
    tenant_id_param UUID,
    project_id_param UUID,
    year_param INTEGER,
    month_param INTEGER
)
RETURNS TABLE (
    personnel_id UUID,
    personnel_name TEXT,
    total_hours DECIMAL(8,2),
    monthly_overtime DECIMAL(8,2),
    yearly_overtime DECIMAL(8,2),
    excess_overtime DECIMAL(8,2),
    joker_hours_needed DECIMAL(8,2),
    joker_days_needed DECIMAL(8,2),
    needs_joker BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    WITH personnel_hours AS (
        SELECT 
            p.id as personnel_id,
            CONCAT(p.first_name, ' ', p.last_name) as personnel_name,
            COALESCE(SUM(
                CASE 
                    WHEN da.shift_type NOT IN ('HT', 'YI') 
                    AND NOT (da.start_time = '00:00' AND da.end_time = '00:00')
                    AND NOT da.is_holiday
                    THEN 
                        CASE 
                            WHEN da.end_time > da.start_time THEN
                                EXTRACT(EPOCH FROM (da.end_time::time - da.start_time::time)) / 3600
                            ELSE
                                EXTRACT(EPOCH FROM (da.end_time::time + INTERVAL '24 hours' - da.start_time::time)) / 3600
                        END
                    ELSE 0
                END
            ), 0) as total_hours
        FROM personnel p
        LEFT JOIN duty_assignments da ON p.id = da.personnel_id
        LEFT JOIN duty_schedules ds ON da.schedule_id = ds.id
        WHERE p.tenant_id = tenant_id_param
        AND (project_id_param IS NULL OR ds.project_id = project_id_param)
        AND ds.year = year_param
        AND ds.month = month_param
        GROUP BY p.id, p.first_name, p.last_name
    )
    SELECT 
        ph.personnel_id,
        ph.personnel_name,
        ph.total_hours,
        GREATEST(ph.total_hours - 195, 0) as monthly_overtime,
        GREATEST(ph.total_hours - 195, 0) * 12 as yearly_overtime,
        GREATEST((ph.total_hours - 195) * 12 - 270, 0) as excess_overtime,
        GREATEST((ph.total_hours - 195) * 12 - 270, 0) as joker_hours_needed,
        GREATEST((ph.total_hours - 195) * 12 - 270, 0) / 12 as joker_days_needed,
        (ph.total_hours - 195) * 12 > 270 as needs_joker
    FROM personnel_hours ph
    WHERE ph.total_hours > 0;
END;
$$ LANGUAGE plpgsql;

-- Joker hesaplama otomatik oluşturma fonksiyonu
CREATE OR REPLACE FUNCTION create_joker_calculations_for_month(
    tenant_id_param UUID,
    project_id_param UUID,
    year_param INTEGER,
    month_param INTEGER
)
RETURNS void AS $$
DECLARE
    calc_record RECORD;
    joker_cost_per_hour DECIMAL(8,2) := 50.00; -- Saatlik joker maliyeti (TL)
BEGIN
    -- Mevcut hesaplamaları sil
    DELETE FROM joker_calculations 
    WHERE tenant_id = tenant_id_param 
    AND project_id = project_id_param 
    AND calculation_year = year_param 
    AND calculation_month = month_param;
    
    -- Yeni hesaplamaları oluştur
    FOR calc_record IN 
        SELECT * FROM calculate_joker_needs(tenant_id_param, project_id_param, year_param, month_param)
    LOOP
        INSERT INTO joker_calculations (
            tenant_id,
            project_id,
            calculation_year,
            calculation_month,
            personnel_id,
            total_working_hours,
            monthly_overtime,
            yearly_overtime,
            excess_overtime,
            joker_hours_needed,
            joker_days_needed,
            joker_cost_estimate,
            status,
            created_by
        ) VALUES (
            tenant_id_param,
            project_id_param,
            year_param,
            month_param,
            calc_record.personnel_id,
            calc_record.total_hours,
            calc_record.monthly_overtime,
            calc_record.yearly_overtime,
            calc_record.excess_overtime,
            calc_record.joker_hours_needed,
            calc_record.joker_days_needed,
            calc_record.joker_hours_needed * joker_cost_per_hour,
            'calculated',
            auth.uid()
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Joker istatistikleri fonksiyonu
CREATE OR REPLACE FUNCTION get_joker_statistics(
    tenant_id_param UUID,
    project_id_param UUID DEFAULT NULL,
    year_param INTEGER DEFAULT NULL
)
RETURNS TABLE (
    total_personnel BIGINT,
    personnel_needing_joker BIGINT,
    total_excess_overtime DECIMAL(8,2),
    total_joker_hours_needed DECIMAL(8,2),
    total_joker_cost DECIMAL(10,2),
    average_joker_per_personnel DECIMAL(8,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_personnel,
        COUNT(*) FILTER (WHERE excess_overtime > 0) as personnel_needing_joker,
        COALESCE(SUM(excess_overtime), 0) as total_excess_overtime,
        COALESCE(SUM(joker_hours_needed), 0) as total_joker_hours_needed,
        COALESCE(SUM(joker_cost_estimate), 0) as total_joker_cost,
        CASE 
            WHEN COUNT(*) > 0 THEN COALESCE(SUM(joker_hours_needed), 0) / COUNT(*)
            ELSE 0
        END as average_joker_per_personnel
    FROM joker_calculations
    WHERE tenant_id = tenant_id_param
    AND (project_id_param IS NULL OR project_id = project_id_param)
    AND (year_param IS NULL OR calculation_year = year_param);
END;
$$ LANGUAGE plpgsql;

-- Joker atama fonksiyonu
CREATE OR REPLACE FUNCTION assign_joker_to_calculation(
    calculation_id_param UUID,
    joker_id_param UUID,
    assigned_hours_param DECIMAL(8,2)
)
RETURNS void AS $$
BEGIN
    UPDATE joker_calculations 
    SET 
        assigned_joker_id = joker_id_param,
        assigned_date = CURRENT_DATE,
        assigned_hours = assigned_hours_param,
        status = 'joker_assigned',
        updated_at = NOW()
    WHERE id = calculation_id_param;
END;
$$ LANGUAGE plpgsql;

