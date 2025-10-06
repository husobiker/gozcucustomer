    -- Kamera tablosu oluşturma
    CREATE TABLE IF NOT EXISTS cameras (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    rtsp_url VARCHAR(500),
    ip VARCHAR(45),
    port INTEGER DEFAULT 554,
    username VARCHAR(100),
    password VARCHAR(100),
    location VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
    is_recording BOOLEAN DEFAULT true,
    recording_quality VARCHAR(50) DEFAULT 'medium' CHECK (recording_quality IN ('low', 'medium', 'high', 'ultra')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
    );

    -- Index'ler
    CREATE INDEX IF NOT EXISTS idx_cameras_project_id ON cameras(project_id);
    CREATE INDEX IF NOT EXISTS idx_cameras_tenant_id ON cameras(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_cameras_status ON cameras(status);

    -- RLS politikaları
    ALTER TABLE cameras ENABLE ROW LEVEL SECURITY;

    -- Tenant bazlı erişim politikası
    DROP POLICY IF EXISTS "cameras_tenant_access" ON cameras;
    CREATE POLICY "cameras_tenant_access" ON cameras
    FOR ALL USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    );

    -- Kamera kayıtları tablosu (opsiyonel - gelecekte kullanım için)
    CREATE TABLE IF NOT EXISTS camera_recordings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    camera_id UUID NOT NULL REFERENCES cameras(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT,
    duration_seconds INTEGER,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    recording_type VARCHAR(50) DEFAULT 'continuous' CHECK (recording_type IN ('continuous', 'motion', 'scheduled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Kamera kayıtları için index'ler
    CREATE INDEX IF NOT EXISTS idx_camera_recordings_camera_id ON camera_recordings(camera_id);
    CREATE INDEX IF NOT EXISTS idx_camera_recordings_tenant_id ON camera_recordings(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_camera_recordings_start_time ON camera_recordings(start_time);

    -- Kamera kayıtları için RLS politikası
    ALTER TABLE camera_recordings ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "camera_recordings_tenant_access" ON camera_recordings;
    CREATE POLICY "camera_recordings_tenant_access" ON camera_recordings
    FOR ALL USING (
        tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    );

    -- Updated_at trigger'ı
    CREATE OR REPLACE FUNCTION update_cameras_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS trigger_update_cameras_updated_at ON cameras;
    CREATE TRIGGER trigger_update_cameras_updated_at
    BEFORE UPDATE ON cameras
    FOR EACH ROW
    EXECUTE FUNCTION update_cameras_updated_at();

    -- Kamera istatistikleri için view
    CREATE OR REPLACE VIEW camera_stats AS
    SELECT 
    c.tenant_id,
    c.project_id,
    COUNT(*) as total_cameras,
    COUNT(CASE WHEN c.status = 'active' THEN 1 END) as active_cameras,
    COUNT(CASE WHEN c.status = 'inactive' THEN 1 END) as inactive_cameras,
    COUNT(CASE WHEN c.status = 'maintenance' THEN 1 END) as maintenance_cameras,
    COUNT(CASE WHEN c.is_recording = true THEN 1 END) as recording_cameras
    FROM cameras c
    GROUP BY c.tenant_id, c.project_id;

    -- Kamera tablosuna yorumlar
    COMMENT ON TABLE cameras IS 'Proje kameraları ve RTSP bağlantı bilgileri';
    COMMENT ON COLUMN cameras.rtsp_url IS 'RTSP stream URL adresi';
    COMMENT ON COLUMN cameras.username IS 'RTSP bağlantısı için kullanıcı adı';
    COMMENT ON COLUMN cameras.password IS 'RTSP bağlantısı için şifre';
    COMMENT ON COLUMN cameras.location IS 'Kameranın fiziksel konumu';
    COMMENT ON COLUMN cameras.recording_quality IS 'Kayıt kalitesi seviyesi';
    COMMENT ON COLUMN cameras.is_recording IS 'Kameranın kayıt yapıp yapmadığı';

    COMMENT ON TABLE camera_recordings IS 'Kamera kayıt dosyaları ve metadata';
    COMMENT ON COLUMN camera_recordings.file_path IS 'Kayıt dosyasının sunucudaki yolu';
    COMMENT ON COLUMN camera_recordings.duration_seconds IS 'Kayıt süresi (saniye)';
    COMMENT ON COLUMN camera_recordings.recording_type IS 'Kayıt türü (sürekli, hareket algılama, zamanlanmış)';
