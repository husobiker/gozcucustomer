-- Vardiya Sistemleri tablosu
-- Farklı vardiya sistemlerini desteklemek için

CREATE TABLE IF NOT EXISTS shift_systems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Sistem bilgileri
    system_name VARCHAR(100) NOT NULL,
    system_type VARCHAR(50) NOT NULL CHECK (system_type IN (
        '8_hour_3_shift',    -- 8 saatlik 3'lü vardiya
        '12_hour_2_shift',   -- 12 saatlik 2'li vardiya (2+2+2)
        '12_36_shift',       -- 12/36 saatlik vardiya
        'custom'             -- Özel sistem
    )),
    description TEXT,
    
    -- Vardiya detayları
    shift_count INTEGER NOT NULL CHECK (shift_count >= 1 AND shift_count <= 4),
    shift_duration DECIMAL(4,2) NOT NULL, -- Saat cinsinden
    total_daily_hours DECIMAL(4,2) NOT NULL, -- Günlük toplam saat
    
    -- Sistem durumu
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    
    -- Yasal bilgiler
    legal_basis TEXT, -- Yasal dayanak
    requires_muvafakatname BOOLEAN DEFAULT false,
    max_consecutive_days INTEGER DEFAULT 6,
    min_rest_hours DECIMAL(4,2) DEFAULT 11,
    
    -- Sistem bilgileri
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    
    -- Kısıtlamalar
    CONSTRAINT valid_shift_duration CHECK (shift_duration > 0 AND shift_duration <= 24),
    CONSTRAINT valid_total_hours CHECK (total_daily_hours > 0 AND total_daily_hours <= 24),
    CONSTRAINT valid_rest_hours CHECK (min_rest_hours >= 0)
);

-- Vardiya Detayları tablosu
CREATE TABLE IF NOT EXISTS shift_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shift_system_id UUID NOT NULL REFERENCES shift_systems(id) ON DELETE CASCADE,
    
    -- Vardiya bilgileri
    shift_name VARCHAR(50) NOT NULL, -- Gündüz, Akşam, Gece
    shift_order INTEGER NOT NULL CHECK (shift_order >= 1 AND shift_order <= 4),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration DECIMAL(4,2) NOT NULL,
    
    -- Vardiya türü
    shift_type VARCHAR(20) NOT NULL CHECK (shift_type IN ('day', 'evening', 'night')),
    
    -- Özel ayarlar
    is_night_shift BOOLEAN DEFAULT false,
    requires_muvafakatname BOOLEAN DEFAULT false,
    break_duration DECIMAL(4,2) DEFAULT 0.5, -- Yemek molası (saat)
    
    -- Sistem bilgileri
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Kısıtlamalar
    CONSTRAINT valid_duration CHECK (duration > 0 AND duration <= 24),
    CONSTRAINT valid_break_duration CHECK (break_duration >= 0 AND break_duration <= 2)
);

-- RLS politikaları
ALTER TABLE shift_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_details ENABLE ROW LEVEL SECURITY;

-- Super admin için tüm vardiya sistemlerini görme yetkisi
CREATE POLICY "Super admin can view all shift systems" ON shift_systems
    FOR ALL USING (true);

CREATE POLICY "Super admin can view all shift details" ON shift_details
    FOR ALL USING (true);

-- Tenant bazlı erişim politikaları
CREATE POLICY "Tenant users can view their shift systems" ON shift_systems
    FOR SELECT USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "Tenant users can insert shift systems" ON shift_systems
    FOR INSERT WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "Tenant users can update shift systems" ON shift_systems
    FOR UPDATE USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "Tenant users can delete shift systems" ON shift_systems
    FOR DELETE USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "Tenant users can view their shift details" ON shift_details
    FOR SELECT USING (shift_system_id IN (
        SELECT id FROM shift_systems WHERE tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    ));

CREATE POLICY "Tenant users can insert shift details" ON shift_details
    FOR INSERT WITH CHECK (shift_system_id IN (
        SELECT id FROM shift_systems WHERE tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    ));

CREATE POLICY "Tenant users can update shift details" ON shift_details
    FOR UPDATE USING (shift_system_id IN (
        SELECT id FROM shift_systems WHERE tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    ));

CREATE POLICY "Tenant users can delete shift details" ON shift_details
    FOR DELETE USING (shift_system_id IN (
        SELECT id FROM shift_systems WHERE tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    ));

-- Indexler
CREATE INDEX IF NOT EXISTS idx_shift_systems_tenant_id ON shift_systems(tenant_id);
CREATE INDEX IF NOT EXISTS idx_shift_systems_project_id ON shift_systems(project_id);
CREATE INDEX IF NOT EXISTS idx_shift_systems_type ON shift_systems(system_type);
CREATE INDEX IF NOT EXISTS idx_shift_systems_active ON shift_systems(is_active);
CREATE INDEX IF NOT EXISTS idx_shift_systems_default ON shift_systems(is_default);

CREATE INDEX IF NOT EXISTS idx_shift_details_system_id ON shift_details(shift_system_id);
CREATE INDEX IF NOT EXISTS idx_shift_details_order ON shift_details(shift_order);
CREATE INDEX IF NOT EXISTS idx_shift_details_type ON shift_details(shift_type);

-- Trigger fonksiyonları
CREATE OR REPLACE FUNCTION update_shift_systems_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_shift_details_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger'lar
CREATE TRIGGER update_shift_systems_updated_at
    BEFORE UPDATE ON shift_systems
    FOR EACH ROW
    EXECUTE FUNCTION update_shift_systems_updated_at();

CREATE TRIGGER update_shift_details_updated_at
    BEFORE UPDATE ON shift_details
    FOR EACH ROW
    EXECUTE FUNCTION update_shift_details_updated_at();

-- 8 saatlik 3'lü vardiya sistemi oluşturma fonksiyonu
CREATE OR REPLACE FUNCTION create_8_hour_3_shift_system(
    tenant_id_param UUID,
    project_id_param UUID,
    system_name_param VARCHAR(100) DEFAULT '8 Saatlik 3''lü Vardiya Sistemi'
)
RETURNS UUID AS $$
DECLARE
    system_id UUID;
BEGIN
    -- Vardiya sistemi oluştur
    INSERT INTO shift_systems (
        tenant_id,
        project_id,
        system_name,
        system_type,
        description,
        shift_count,
        shift_duration,
        total_daily_hours,
        legal_basis,
        requires_muvafakatname,
        created_by
    ) VALUES (
        tenant_id_param,
        project_id_param,
        system_name_param,
        '8_hour_3_shift',
        '8 saatlik 3''lü vardiya sistemi - Gündüz, Akşam, Gece',
        3,
        8.0,
        24.0,
        'İş Kanunu - 8 saatlik çalışma süresi',
        false,
        auth.uid()
    ) RETURNING id INTO system_id;
    
    -- Vardiya detaylarını oluştur
    INSERT INTO shift_details (
        shift_system_id,
        shift_name,
        shift_order,
        start_time,
        end_time,
        duration,
        shift_type,
        is_night_shift,
        requires_muvafakatname,
        break_duration
    ) VALUES 
    (
        system_id,
        'Gündüz Vardiyası',
        1,
        '07:00:00',
        '15:00:00',
        8.0,
        'day',
        false,
        false,
        0.5
    ),
    (
        system_id,
        'Akşam Vardiyası',
        2,
        '15:00:00',
        '23:00:00',
        8.0,
        'evening',
        false,
        false,
        0.5
    ),
    (
        system_id,
        'Gece Vardiyası',
        3,
        '23:00:00',
        '07:00:00',
        8.0,
        'night',
        true,
        true,
        0.5
    );
    
    RETURN system_id;
END;
$$ LANGUAGE plpgsql;

-- 12 saatlik 2'li vardiya sistemi oluşturma fonksiyonu
CREATE OR REPLACE FUNCTION create_12_hour_2_shift_system(
    tenant_id_param UUID,
    project_id_param UUID,
    system_name_param VARCHAR(100) DEFAULT '12 Saatlik 2''li Vardiya Sistemi (2+2+2)'
)
RETURNS UUID AS $$
DECLARE
    system_id UUID;
BEGIN
    -- Vardiya sistemi oluştur
    INSERT INTO shift_systems (
        tenant_id,
        project_id,
        system_name,
        system_type,
        description,
        shift_count,
        shift_duration,
        total_daily_hours,
        legal_basis,
        requires_muvafakatname,
        created_by
    ) VALUES (
        tenant_id_param,
        project_id_param,
        system_name_param,
        '12_hour_2_shift',
        '12 saatlik 2''li vardiya sistemi - 2+2+2 rotasyonu',
        2,
        12.0,
        24.0,
        '6645 sayılı Torba Yasa - Özel Güvenlik Sektörü İstisnası',
        true,
        auth.uid()
    ) RETURNING id INTO system_id;
    
    -- Vardiya detaylarını oluştur
    INSERT INTO shift_details (
        shift_system_id,
        shift_name,
        shift_order,
        start_time,
        end_time,
        duration,
        shift_type,
        is_night_shift,
        requires_muvafakatname,
        break_duration
    ) VALUES 
    (
        system_id,
        'Gündüz Vardiyası',
        1,
        '08:00:00',
        '20:00:00',
        12.0,
        'day',
        false,
        false,
        1.0
    ),
    (
        system_id,
        'Gece Vardiyası',
        2,
        '20:00:00',
        '08:00:00',
        12.0,
        'night',
        true,
        true,
        1.0
    );
    
    RETURN system_id;
END;
$$ LANGUAGE plpgsql;

-- 12/36 saatlik vardiya sistemi oluşturma fonksiyonu
CREATE OR REPLACE FUNCTION create_12_36_shift_system(
    tenant_id_param UUID,
    project_id_param UUID,
    system_name_param VARCHAR(100) DEFAULT '12/36 Saatlik Vardiya Sistemi'
)
RETURNS UUID AS $$
DECLARE
    system_id UUID;
BEGIN
    -- Vardiya sistemi oluştur
    INSERT INTO shift_systems (
        tenant_id,
        project_id,
        system_name,
        system_type,
        description,
        shift_count,
        shift_duration,
        total_daily_hours,
        legal_basis,
        requires_muvafakatname,
        created_by
    ) VALUES (
        tenant_id_param,
        project_id_param,
        system_name_param,
        '12_36_shift',
        '12 saat çalışma, 36 saat dinlenme sistemi',
        1,
        12.0,
        12.0,
        '6645 sayılı Torba Yasa - Özel Güvenlik Sektörü İstisnası',
        true,
        auth.uid()
    ) RETURNING id INTO system_id;
    
    -- Vardiya detayını oluştur
    INSERT INTO shift_details (
        shift_system_id,
        shift_name,
        shift_order,
        start_time,
        end_time,
        duration,
        shift_type,
        is_night_shift,
        requires_muvafakatname,
        break_duration
    ) VALUES 
    (
        system_id,
        '12 Saatlik Vardiya',
        1,
        '08:00:00',
        '20:00:00',
        12.0,
        'day',
        false,
        true,
        1.0
    );
    
    RETURN system_id;
END;
$$ LANGUAGE plpgsql;

-- Vardiya sistemi bilgilerini getirme fonksiyonu
CREATE OR REPLACE FUNCTION get_shift_system_info(
    tenant_id_param UUID,
    project_id_param UUID DEFAULT NULL
)
RETURNS TABLE (
    system_id UUID,
    system_name VARCHAR(100),
    system_type VARCHAR(50),
    description TEXT,
    shift_count INTEGER,
    shift_duration DECIMAL(4,2),
    total_daily_hours DECIMAL(4,2),
    is_active BOOLEAN,
    is_default BOOLEAN,
    requires_muvafakatname BOOLEAN,
    shift_details JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ss.id as system_id,
        ss.system_name,
        ss.system_type,
        ss.description,
        ss.shift_count,
        ss.shift_duration,
        ss.total_daily_hours,
        ss.is_active,
        ss.is_default,
        ss.requires_muvafakatname,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', sd.id,
                    'shift_name', sd.shift_name,
                    'shift_order', sd.shift_order,
                    'start_time', sd.start_time,
                    'end_time', sd.end_time,
                    'duration', sd.duration,
                    'shift_type', sd.shift_type,
                    'is_night_shift', sd.is_night_shift,
                    'requires_muvafakatname', sd.requires_muvafakatname,
                    'break_duration', sd.break_duration
                ) ORDER BY sd.shift_order
            ) FILTER (WHERE sd.id IS NOT NULL),
            '[]'::jsonb
        ) as shift_details
    FROM shift_systems ss
    LEFT JOIN shift_details sd ON ss.id = sd.shift_system_id
    WHERE ss.tenant_id = tenant_id_param
    AND (project_id_param IS NULL OR ss.project_id = project_id_param)
    AND ss.is_active = true
    GROUP BY ss.id, ss.system_name, ss.system_type, ss.description, 
             ss.shift_count, ss.shift_duration, ss.total_daily_hours, 
             ss.is_active, ss.is_default, ss.requires_muvafakatname
    ORDER BY ss.is_default DESC, ss.created_at DESC;
END;
$$ LANGUAGE plpgsql;


