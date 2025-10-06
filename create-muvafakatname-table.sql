-- Muvafakatname (Yazılı Onay) tablosu
-- Gece vardiyası ve uzun çalışma saatleri için yasal zorunluluk

CREATE TABLE IF NOT EXISTS muvafakatname (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    personnel_id UUID NOT NULL REFERENCES personnel(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Muvafakatname türü
    muvafakatname_type VARCHAR(50) NOT NULL CHECK (muvafakatname_type IN (
        'night_shift',           -- Gece vardiyası (7.5 saatten fazla)
        'extended_hours',        -- Uzun çalışma saatleri (11 saatten fazla)
        'weekly_overtime',       -- Haftalık fazla mesai (45 saatten fazla)
        'holiday_work',          -- Tatil günü çalışması
        'consecutive_shifts'     -- Ardışık vardiyalar
    )),
    
    -- Çalışma detayları
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    shift_type VARCHAR(20) NOT NULL DEFAULT 'night' CHECK (shift_type IN ('day', 'night', 'full')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    daily_hours DECIMAL(4,2) NOT NULL, -- Günlük çalışma saati
    
    -- Muvafakatname durumu
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending',      -- Beklemede
        'signed',       -- İmzalanmış
        'expired',      -- Süresi dolmuş
        'cancelled'     -- İptal edilmiş
    )),
    
    -- İmza bilgileri
    signed_date DATE,
    signed_at TIMESTAMP WITH TIME ZONE,
    signature_data TEXT, -- Dijital imza verisi (base64)
    
    -- Yasal bilgiler
    legal_basis TEXT, -- Yasal dayanak (6645 sayılı Torba Yasa vb.)
    additional_compensation DECIMAL(10,2) DEFAULT 0, -- Ek ücret
    
    -- Notlar ve açıklamalar
    notes TEXT,
    personnel_notes TEXT, -- Personelin notları
    admin_notes TEXT,    -- Yönetici notları
    
    -- Sistem bilgileri
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    
    -- Kısıtlamalar
    CONSTRAINT valid_date_range CHECK (end_date >= start_date),
    CONSTRAINT valid_daily_hours CHECK (daily_hours > 0 AND daily_hours <= 24),
    CONSTRAINT valid_compensation CHECK (additional_compensation >= 0)
);

-- RLS politikaları
ALTER TABLE muvafakatname ENABLE ROW LEVEL SECURITY;

-- Super admin için tüm muvafakatname verilerini görme yetkisi
CREATE POLICY "Super admin can view all muvafakatname" ON muvafakatname
    FOR ALL USING (true);

-- Tenant bazlı erişim politikaları
CREATE POLICY "Tenant users can view their muvafakatname" ON muvafakatname
    FOR SELECT USING (tenant_id IN (
        SELECT id FROM tenants WHERE id = auth.jwt() ->> 'tenant_id'
    ));

CREATE POLICY "Tenant users can insert muvafakatname" ON muvafakatname
    FOR INSERT WITH CHECK (tenant_id IN (
        SELECT id FROM tenants WHERE id = auth.jwt() ->> 'tenant_id'
    ));

CREATE POLICY "Tenant users can update muvafakatname" ON muvafakatname
    FOR UPDATE USING (tenant_id IN (
        SELECT id FROM tenants WHERE id = auth.jwt() ->> 'tenant_id'
    ));

CREATE POLICY "Tenant users can delete muvafakatname" ON muvafakatname
    FOR DELETE USING (tenant_id IN (
        SELECT id FROM tenants WHERE id = auth.jwt() ->> 'tenant_id'
    ));

-- Indexler
CREATE INDEX IF NOT EXISTS idx_muvafakatname_tenant_id ON muvafakatname(tenant_id);
CREATE INDEX IF NOT EXISTS idx_muvafakatname_personnel_id ON muvafakatname(personnel_id);
CREATE INDEX IF NOT EXISTS idx_muvafakatname_project_id ON muvafakatname(project_id);
CREATE INDEX IF NOT EXISTS idx_muvafakatname_type ON muvafakatname(muvafakatname_type);
CREATE INDEX IF NOT EXISTS idx_muvafakatname_status ON muvafakatname(status);
CREATE INDEX IF NOT EXISTS idx_muvafakatname_dates ON muvafakatname(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_muvafakatname_signed_date ON muvafakatname(signed_date);

-- Trigger fonksiyonu
CREATE OR REPLACE FUNCTION update_muvafakatname_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER update_muvafakatname_updated_at
    BEFORE UPDATE ON muvafakatname
    FOR EACH ROW
    EXECUTE FUNCTION update_muvafakatname_updated_at();

-- Muvafakatname otomatik oluşturma fonksiyonu
CREATE OR REPLACE FUNCTION create_muvafakatname_for_night_shift(
    personnel_id_param UUID,
    project_id_param UUID,
    start_date_param DATE,
    end_date_param DATE,
    start_time_param TIME,
    end_time_param TIME,
    daily_hours_param DECIMAL(4,2)
)
RETURNS UUID AS $$
DECLARE
    muvafakatname_id UUID;
    tenant_id_param UUID;
BEGIN
    -- Personnel'in tenant_id'sini al
    SELECT tenant_id INTO tenant_id_param
    FROM personnel 
    WHERE id = personnel_id_param;
    
    -- Muvafakatname oluştur
    INSERT INTO muvafakatname (
        tenant_id,
        personnel_id,
        project_id,
        muvafakatname_type,
        start_date,
        end_date,
        shift_type,
        start_time,
        end_time,
        daily_hours,
        status,
        legal_basis,
        created_by
    ) VALUES (
        tenant_id_param,
        personnel_id_param,
        project_id_param,
        'night_shift',
        start_date_param,
        end_date_param,
        'night',
        start_time_param,
        end_time_param,
        daily_hours_param,
        'pending',
        '6645 sayılı Torba Yasa - Özel Güvenlik Sektörü İstisnası',
        auth.uid()
    ) RETURNING id INTO muvafakatname_id;
    
    RETURN muvafakatname_id;
END;
$$ LANGUAGE plpgsql;

-- Süresi dolmuş muvafakatname'leri otomatik güncelleme fonksiyonu
CREATE OR REPLACE FUNCTION update_expired_muvafakatname()
RETURNS void AS $$
BEGIN
    UPDATE muvafakatname 
    SET status = 'expired',
        updated_at = NOW()
    WHERE status = 'signed' 
    AND end_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Süresi dolmuş muvafakatname'leri günlük kontrol eden fonksiyon
CREATE OR REPLACE FUNCTION check_expired_muvafakatname_daily()
RETURNS void AS $$
BEGIN
    PERFORM update_expired_muvafakatname();
END;
$$ LANGUAGE plpgsql;

-- Muvafakatname istatistikleri fonksiyonu
CREATE OR REPLACE FUNCTION get_muvafakatname_stats(
    tenant_id_param UUID,
    start_date_param DATE DEFAULT NULL,
    end_date_param DATE DEFAULT NULL
)
RETURNS TABLE (
    total_count BIGINT,
    pending_count BIGINT,
    signed_count BIGINT,
    expired_count BIGINT,
    cancelled_count BIGINT,
    night_shift_count BIGINT,
    extended_hours_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_count,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
        COUNT(*) FILTER (WHERE status = 'signed') as signed_count,
        COUNT(*) FILTER (WHERE status = 'expired') as expired_count,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_count,
        COUNT(*) FILTER (WHERE muvafakatname_type = 'night_shift') as night_shift_count,
        COUNT(*) FILTER (WHERE muvafakatname_type = 'extended_hours') as extended_hours_count
    FROM muvafakatname
    WHERE tenant_id = tenant_id_param
    AND (start_date_param IS NULL OR start_date >= start_date_param)
    AND (end_date_param IS NULL OR end_date <= end_date_param);
END;
$$ LANGUAGE plpgsql;







