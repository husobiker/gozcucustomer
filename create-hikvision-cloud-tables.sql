-- Hikvision Cloud Entegrasyonu için Veritabanı Tabloları

-- Hikvision Cloud konfigürasyon tablosu
CREATE TABLE IF NOT EXISTS hikvision_cloud_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    app_key VARCHAR(255) NOT NULL,
    app_secret VARCHAR(255) NOT NULL,
    base_url VARCHAR(500) DEFAULT 'https://open.hik-connect.com',
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hikvision Cloud kameraları tablosu
CREATE TABLE IF NOT EXISTS hikvision_cloud_cameras (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    hikvision_device_id VARCHAR(255) NOT NULL, -- Hikvision'dan gelen device ID
    device_serial VARCHAR(255) NOT NULL,
    channel_no INTEGER DEFAULT 1,
    name VARCHAR(255) NOT NULL,
    model VARCHAR(255),
    status VARCHAR(50) DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'error')),
    location VARCHAR(500),
    thumbnail_url TEXT,
    live_stream_url TEXT,
    rtsp_url TEXT,
    hls_url TEXT,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, hikvision_device_id, channel_no)
);

-- Hikvision Cloud stream geçmişi tablosu
CREATE TABLE IF NOT EXISTS hikvision_cloud_streams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    camera_id UUID NOT NULL REFERENCES hikvision_cloud_cameras(id) ON DELETE CASCADE,
    stream_type VARCHAR(50) NOT NULL CHECK (stream_type IN ('live', 'playback', 'snapshot')),
    stream_url TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hikvision Cloud kayıtları tablosu
CREATE TABLE IF NOT EXISTS hikvision_cloud_recordings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    camera_id UUID NOT NULL REFERENCES hikvision_cloud_cameras(id) ON DELETE CASCADE,
    recording_id VARCHAR(255) NOT NULL, -- Hikvision'dan gelen recording ID
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    file_size BIGINT,
    duration_seconds INTEGER,
    file_url TEXT,
    thumbnail_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(camera_id, recording_id)
);

-- Hikvision Cloud entegrasyon logları tablosu
CREATE TABLE IF NOT EXISTS hikvision_cloud_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    log_level VARCHAR(20) NOT NULL CHECK (log_level IN ('info', 'warning', 'error', 'debug')),
    message TEXT NOT NULL,
    details JSONB,
    camera_id UUID REFERENCES hikvision_cloud_cameras(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_hikvision_cloud_configs_tenant_id ON hikvision_cloud_configs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_hikvision_cloud_cameras_tenant_id ON hikvision_cloud_cameras(tenant_id);
CREATE INDEX IF NOT EXISTS idx_hikvision_cloud_cameras_project_id ON hikvision_cloud_cameras(project_id);
CREATE INDEX IF NOT EXISTS idx_hikvision_cloud_cameras_device_serial ON hikvision_cloud_cameras(device_serial);
CREATE INDEX IF NOT EXISTS idx_hikvision_cloud_streams_camera_id ON hikvision_cloud_streams(camera_id);
CREATE INDEX IF NOT EXISTS idx_hikvision_cloud_recordings_camera_id ON hikvision_cloud_recordings(camera_id);
CREATE INDEX IF NOT EXISTS idx_hikvision_cloud_recordings_time_range ON hikvision_cloud_recordings(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_hikvision_cloud_logs_tenant_id ON hikvision_cloud_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_hikvision_cloud_logs_created_at ON hikvision_cloud_logs(created_at);

-- RLS (Row Level Security) politikaları
ALTER TABLE hikvision_cloud_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE hikvision_cloud_cameras ENABLE ROW LEVEL SECURITY;
ALTER TABLE hikvision_cloud_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE hikvision_cloud_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE hikvision_cloud_logs ENABLE ROW LEVEL SECURITY;

-- Hikvision Cloud configs için RLS politikaları
CREATE POLICY "Users can view hikvision configs for their tenant" ON hikvision_cloud_configs
    FOR SELECT USING (tenant_id = (SELECT id FROM tenants WHERE subdomain = current_setting('app.current_tenant')));

CREATE POLICY "Users can insert hikvision configs for their tenant" ON hikvision_cloud_configs
    FOR INSERT WITH CHECK (tenant_id = (SELECT id FROM tenants WHERE subdomain = current_setting('app.current_tenant')));

CREATE POLICY "Users can update hikvision configs for their tenant" ON hikvision_cloud_configs
    FOR UPDATE USING (tenant_id = (SELECT id FROM tenants WHERE subdomain = current_setting('app.current_tenant')));

CREATE POLICY "Users can delete hikvision configs for their tenant" ON hikvision_cloud_configs
    FOR DELETE USING (tenant_id = (SELECT id FROM tenants WHERE subdomain = current_setting('app.current_tenant')));

-- Hikvision Cloud cameras için RLS politikaları
CREATE POLICY "Users can view hikvision cameras for their tenant" ON hikvision_cloud_cameras
    FOR SELECT USING (tenant_id = (SELECT id FROM tenants WHERE subdomain = current_setting('app.current_tenant')));

CREATE POLICY "Users can insert hikvision cameras for their tenant" ON hikvision_cloud_cameras
    FOR INSERT WITH CHECK (tenant_id = (SELECT id FROM tenants WHERE subdomain = current_setting('app.current_tenant')));

CREATE POLICY "Users can update hikvision cameras for their tenant" ON hikvision_cloud_cameras
    FOR UPDATE USING (tenant_id = (SELECT id FROM tenants WHERE subdomain = current_setting('app.current_tenant')));

CREATE POLICY "Users can delete hikvision cameras for their tenant" ON hikvision_cloud_cameras
    FOR DELETE USING (tenant_id = (SELECT id FROM tenants WHERE subdomain = current_setting('app.current_tenant')));

-- Hikvision Cloud streams için RLS politikaları
CREATE POLICY "Users can view hikvision streams for their tenant" ON hikvision_cloud_streams
    FOR SELECT USING (camera_id IN (
        SELECT id FROM hikvision_cloud_cameras 
        WHERE tenant_id = (SELECT id FROM tenants WHERE subdomain = current_setting('app.current_tenant'))
    ));

CREATE POLICY "Users can insert hikvision streams for their tenant" ON hikvision_cloud_streams
    FOR INSERT WITH CHECK (camera_id IN (
        SELECT id FROM hikvision_cloud_cameras 
        WHERE tenant_id = (SELECT id FROM tenants WHERE subdomain = current_setting('app.current_tenant'))
    ));

CREATE POLICY "Users can update hikvision streams for their tenant" ON hikvision_cloud_streams
    FOR UPDATE USING (camera_id IN (
        SELECT id FROM hikvision_cloud_cameras 
        WHERE tenant_id = (SELECT id FROM tenants WHERE subdomain = current_setting('app.current_tenant'))
    ));

CREATE POLICY "Users can delete hikvision streams for their tenant" ON hikvision_cloud_streams
    FOR DELETE USING (camera_id IN (
        SELECT id FROM hikvision_cloud_cameras 
        WHERE tenant_id = (SELECT id FROM tenants WHERE subdomain = current_setting('app.current_tenant'))
    ));

-- Hikvision Cloud recordings için RLS politikaları
CREATE POLICY "Users can view hikvision recordings for their tenant" ON hikvision_cloud_recordings
    FOR SELECT USING (camera_id IN (
        SELECT id FROM hikvision_cloud_cameras 
        WHERE tenant_id = (SELECT id FROM tenants WHERE subdomain = current_setting('app.current_tenant'))
    ));

CREATE POLICY "Users can insert hikvision recordings for their tenant" ON hikvision_cloud_recordings
    FOR INSERT WITH CHECK (camera_id IN (
        SELECT id FROM hikvision_cloud_cameras 
        WHERE tenant_id = (SELECT id FROM tenants WHERE subdomain = current_setting('app.current_tenant'))
    ));

CREATE POLICY "Users can update hikvision recordings for their tenant" ON hikvision_cloud_recordings
    FOR UPDATE USING (camera_id IN (
        SELECT id FROM hikvision_cloud_cameras 
        WHERE tenant_id = (SELECT id FROM tenants WHERE subdomain = current_setting('app.current_tenant'))
    ));

CREATE POLICY "Users can delete hikvision recordings for their tenant" ON hikvision_cloud_recordings
    FOR DELETE USING (camera_id IN (
        SELECT id FROM hikvision_cloud_cameras 
        WHERE tenant_id = (SELECT id FROM tenants WHERE subdomain = current_setting('app.current_tenant'))
    ));

-- Hikvision Cloud logs için RLS politikaları
CREATE POLICY "Users can view hikvision logs for their tenant" ON hikvision_cloud_logs
    FOR SELECT USING (tenant_id = (SELECT id FROM tenants WHERE subdomain = current_setting('app.current_tenant')));

CREATE POLICY "Users can insert hikvision logs for their tenant" ON hikvision_cloud_logs
    FOR INSERT WITH CHECK (tenant_id = (SELECT id FROM tenants WHERE subdomain = current_setting('app.current_tenant')));

-- Trigger'lar
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_hikvision_cloud_configs_updated_at 
    BEFORE UPDATE ON hikvision_cloud_configs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hikvision_cloud_cameras_updated_at 
    BEFORE UPDATE ON hikvision_cloud_cameras 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Demo data (test için)
INSERT INTO hikvision_cloud_configs (tenant_id, app_key, app_secret, is_active)
SELECT 
    t.id,
    'demo_app_key_' || t.subdomain,
    'demo_app_secret_' || t.subdomain,
    true
FROM tenants t
WHERE t.subdomain = 'abc-guvenlik'
ON CONFLICT DO NOTHING;

-- Demo kameralar
INSERT INTO hikvision_cloud_cameras (tenant_id, project_id, hikvision_device_id, device_serial, name, model, status, location)
SELECT 
    t.id,
    p.id,
    'DEMO_DEVICE_' || p.id || '_1',
    'DEMO_SERIAL_' || p.id || '_1',
    p.name || ' - Ana Giriş Kamerası',
    'DS-2CD2143G0-I',
    'online',
    'Ana Giriş'
FROM tenants t
CROSS JOIN projects p
WHERE t.subdomain = 'abc-guvenlik'
ON CONFLICT DO NOTHING;

INSERT INTO hikvision_cloud_cameras (tenant_id, project_id, hikvision_device_id, device_serial, name, model, status, location)
SELECT 
    t.id,
    p.id,
    'DEMO_DEVICE_' || p.id || '_2',
    'DEMO_SERIAL_' || p.id || '_2',
    p.name || ' - Park Alanı Kamerası',
    'DS-2CD2043G0-I',
    'offline',
    'Park Alanı'
FROM tenants t
CROSS JOIN projects p
WHERE t.subdomain = 'abc-guvenlik'
ON CONFLICT DO NOTHING;


