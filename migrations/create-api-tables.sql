-- API yönetimi tabloları oluşturma

-- API anahtarları tablosu
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) NOT NULL UNIQUE, -- SHA-256 hash of the actual key
    key_prefix VARCHAR(20) NOT NULL, -- First 8 characters for display
    tenant_id UUID REFERENCES tenants(id),
    user_id UUID REFERENCES auth.users(id),
    permissions JSONB DEFAULT '[]'::JSONB, -- Array of allowed permissions
    rate_limit_per_hour INTEGER DEFAULT 1000,
    rate_limit_per_day INTEGER DEFAULT 10000,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    metadata JSONB DEFAULT '{}'::JSONB
);

-- API kullanım istatistikleri tablosu
CREATE TABLE IF NOT EXISTS api_usage_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID REFERENCES api_keys(id),
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER NOT NULL,
    response_time_ms INTEGER,
    request_size_bytes INTEGER,
    response_size_bytes INTEGER,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rate limiting tablosu
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID REFERENCES api_keys(id),
    window_start TIMESTAMP WITH TIME ZONE NOT NULL,
    window_type VARCHAR(20) NOT NULL, -- hour, day, month
    request_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(api_key_id, window_start, window_type)
);

-- API endpoint tanımları tablosu
CREATE TABLE IF NOT EXISTS api_endpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    path VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    requires_auth BOOLEAN DEFAULT true,
    rate_limit_per_hour INTEGER DEFAULT 100,
    rate_limit_per_day INTEGER DEFAULT 1000,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(path, method)
);

-- API webhook'ları tablosu
CREATE TABLE IF NOT EXISTS api_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    events TEXT[] NOT NULL, -- Array of events to listen for
    secret_key VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    tenant_id UUID REFERENCES tenants(id),
    retry_count INTEGER DEFAULT 3,
    timeout_seconds INTEGER DEFAULT 30,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Webhook gönderim geçmişi tablosu
CREATE TABLE IF NOT EXISTS webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id UUID REFERENCES api_webhooks(id),
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(20) NOT NULL, -- pending, sent, failed, retrying
    response_status INTEGER,
    response_body TEXT,
    attempt_count INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    delivered_at TIMESTAMP WITH TIME ZONE
);

-- RLS politikaları
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

-- Super admin için tüm API verilerini görme yetkisi
CREATE POLICY "Super admin can view all api keys" ON api_keys
    FOR ALL USING (true);

CREATE POLICY "Super admin can view all api usage stats" ON api_usage_stats
    FOR ALL USING (true);

CREATE POLICY "Super admin can view all rate limits" ON rate_limits
    FOR ALL USING (true);

CREATE POLICY "Super admin can view all api endpoints" ON api_endpoints
    FOR ALL USING (true);

CREATE POLICY "Super admin can view all api webhooks" ON api_webhooks
    FOR ALL USING (true);

CREATE POLICY "Super admin can view all webhook deliveries" ON webhook_deliveries
    FOR ALL USING (true);

-- Indexler
CREATE INDEX IF NOT EXISTS idx_api_keys_tenant_id ON api_keys(tenant_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_api_usage_stats_api_key_id ON api_usage_stats(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_stats_endpoint ON api_usage_stats(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_usage_stats_created_at ON api_usage_stats(created_at);
CREATE INDEX IF NOT EXISTS idx_rate_limits_api_key_id ON rate_limits(api_key_id);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON rate_limits(window_start);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_id ON webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON webhook_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_created_at ON webhook_deliveries(created_at);

-- Trigger fonksiyonları
CREATE OR REPLACE FUNCTION update_api_key_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_api_endpoint_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_api_webhook_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger'lar
CREATE TRIGGER update_api_keys_updated_at
    BEFORE UPDATE ON api_keys
    FOR EACH ROW
    EXECUTE FUNCTION update_api_key_updated_at();

CREATE TRIGGER update_api_endpoints_updated_at
    BEFORE UPDATE ON api_endpoints
    FOR EACH ROW
    EXECUTE FUNCTION update_api_endpoint_updated_at();

CREATE TRIGGER update_api_webhooks_updated_at
    BEFORE UPDATE ON api_webhooks
    FOR EACH ROW
    EXECUTE FUNCTION update_api_webhook_updated_at();

-- API anahtarı oluşturma fonksiyonu
CREATE OR REPLACE FUNCTION create_api_key(
    name_param VARCHAR(255),
    tenant_id_param UUID DEFAULT NULL,
    user_id_param UUID DEFAULT NULL,
    permissions_param JSONB DEFAULT '[]'::JSONB,
    rate_limit_per_hour_param INTEGER DEFAULT 1000,
    rate_limit_per_day_param INTEGER DEFAULT 10000,
    expires_at_param TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_by_param UUID DEFAULT NULL
)
RETURNS TABLE (
    api_key_id UUID,
    api_key VARCHAR(255)
) AS $$
DECLARE
    generated_key VARCHAR(255);
    key_hash VARCHAR(255);
    key_prefix VARCHAR(20);
    new_api_key_id UUID;
BEGIN
    -- API anahtarı oluştur (32 karakter, base64 benzeri)
    generated_key := encode(gen_random_bytes(24), 'base64');
    key_hash := encode(digest(generated_key, 'sha256'), 'hex');
    key_prefix := LEFT(generated_key, 8);
    
    -- API anahtarı kaydı oluştur
    INSERT INTO api_keys (
        name, key_hash, key_prefix, tenant_id, user_id, permissions,
        rate_limit_per_hour, rate_limit_per_day, expires_at, created_by
    ) VALUES (
        name_param, key_hash, key_prefix, tenant_id_param, user_id_param,
        permissions_param, rate_limit_per_hour_param, rate_limit_per_day_param,
        expires_at_param, created_by_param
    ) RETURNING id INTO new_api_key_id;
    
    RETURN QUERY SELECT new_api_key_id, generated_key;
END;
$$ LANGUAGE plpgsql;

-- Rate limit kontrolü fonksiyonu
CREATE OR REPLACE FUNCTION check_rate_limit(
    api_key_id_param UUID,
    window_type_param VARCHAR(20) DEFAULT 'hour'
)
RETURNS BOOLEAN AS $$
DECLARE
    api_key_record RECORD;
    current_window TIMESTAMP WITH TIME ZONE;
    current_count INTEGER;
    max_requests INTEGER;
BEGIN
    -- API anahtarı bilgilerini al
    SELECT * INTO api_key_record FROM api_keys WHERE id = api_key_id_param AND is_active = true;
    
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Zaman penceresini hesapla
    IF window_type_param = 'hour' THEN
        current_window := date_trunc('hour', NOW());
        max_requests := api_key_record.rate_limit_per_hour;
    ELSIF window_type_param = 'day' THEN
        current_window := date_trunc('day', NOW());
        max_requests := api_key_record.rate_limit_per_day;
    ELSE
        RETURN false;
    END IF;
    
    -- Mevcut istek sayısını al
    SELECT COALESCE(request_count, 0) INTO current_count
    FROM rate_limits
    WHERE api_key_id = api_key_id_param 
    AND window_start = current_window 
    AND window_type = window_type_param;
    
    -- Rate limit kontrolü
    IF current_count >= max_requests THEN
        RETURN false;
    END IF;
    
    -- İstek sayısını artır
    INSERT INTO rate_limits (api_key_id, window_start, window_type, request_count)
    VALUES (api_key_id_param, current_window, window_type_param, 1)
    ON CONFLICT (api_key_id, window_start, window_type)
    DO UPDATE SET request_count = rate_limits.request_count + 1;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- API kullanım istatistiği kaydetme fonksiyonu
CREATE OR REPLACE FUNCTION log_api_usage(
    api_key_id_param UUID,
    endpoint_param VARCHAR(255),
    method_param VARCHAR(10),
    status_code_param INTEGER,
    response_time_ms_param INTEGER DEFAULT NULL,
    request_size_bytes_param INTEGER DEFAULT NULL,
    response_size_bytes_param INTEGER DEFAULT NULL,
    ip_address_param INET DEFAULT NULL,
    user_agent_param TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    usage_id UUID;
BEGIN
    INSERT INTO api_usage_stats (
        api_key_id, endpoint, method, status_code, response_time_ms,
        request_size_bytes, response_size_bytes, ip_address, user_agent
    ) VALUES (
        api_key_id_param, endpoint_param, method_param, status_code_param,
        response_time_ms_param, request_size_bytes_param, response_size_bytes_param,
        ip_address_param, user_agent_param
    ) RETURNING id INTO usage_id;
    
    -- Last used at güncelle
    UPDATE api_keys 
    SET last_used_at = NOW() 
    WHERE id = api_key_id_param;
    
    RETURN usage_id;
END;
$$ LANGUAGE plpgsql;

-- Webhook gönderimi fonksiyonu
CREATE OR REPLACE FUNCTION send_webhook(
    webhook_id_param UUID,
    event_type_param VARCHAR(100),
    payload_param JSONB
)
RETURNS UUID AS $$
DECLARE
    delivery_id UUID;
    webhook_record RECORD;
BEGIN
    -- Webhook bilgilerini al
    SELECT * INTO webhook_record FROM api_webhooks WHERE id = webhook_id_param AND is_active = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Webhook bulunamadı: %', webhook_id_param;
    END IF;
    
    -- Event type kontrolü
    IF NOT (event_type_param = ANY(webhook_record.events)) THEN
        RAISE EXCEPTION 'Event type desteklenmiyor: %', event_type_param;
    END IF;
    
    -- Delivery kaydı oluştur
    INSERT INTO webhook_deliveries (
        webhook_id, event_type, payload, status, max_attempts
    ) VALUES (
        webhook_id_param, event_type_param, payload_param, 'pending', webhook_record.retry_count
    ) RETURNING id INTO delivery_id;
    
    -- Simüle edilmiş webhook gönderimi
    -- Gerçek implementasyonda HTTP isteği gönderilecek
    
    RETURN delivery_id;
END;
$$ LANGUAGE plpgsql;

-- API istatistikleri fonksiyonu
CREATE OR REPLACE FUNCTION get_api_statistics(
    api_key_id_param UUID DEFAULT NULL,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '24 hours',
    end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
    total_requests BIGINT,
    successful_requests BIGINT,
    failed_requests BIGINT,
    average_response_time DECIMAL,
    total_data_transferred BIGINT,
    most_used_endpoint VARCHAR(255)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_requests,
        COUNT(*) FILTER (WHERE status_code < 400) as successful_requests,
        COUNT(*) FILTER (WHERE status_code >= 400) as failed_requests,
        ROUND(AVG(response_time_ms), 2) as average_response_time,
        COALESCE(SUM(request_size_bytes + response_size_bytes), 0) as total_data_transferred,
        (
            SELECT endpoint 
            FROM api_usage_stats 
            WHERE (api_key_id_param IS NULL OR api_key_id = api_key_id_param)
            AND created_at BETWEEN start_date AND end_date
            GROUP BY endpoint 
            ORDER BY COUNT(*) DESC 
            LIMIT 1
        ) as most_used_endpoint
    FROM api_usage_stats
    WHERE (api_key_id_param IS NULL OR api_key_id = api_key_id_param)
    AND created_at BETWEEN start_date AND end_date;
END;
$$ LANGUAGE plpgsql;

-- Varsayılan API endpoint'leri
INSERT INTO api_endpoints (path, method, description, category, requires_auth, rate_limit_per_hour, rate_limit_per_day) VALUES
('/api/v1/tenants', 'GET', 'Tenant listesini getir', 'tenants', true, 100, 1000),
('/api/v1/tenants', 'POST', 'Yeni tenant oluştur', 'tenants', true, 10, 100),
('/api/v1/tenants/{id}', 'GET', 'Tenant detaylarını getir', 'tenants', true, 200, 2000),
('/api/v1/tenants/{id}', 'PUT', 'Tenant güncelle', 'tenants', true, 50, 500),
('/api/v1/tenants/{id}', 'DELETE', 'Tenant sil', 'tenants', true, 10, 100),
('/api/v1/users', 'GET', 'Kullanıcı listesini getir', 'users', true, 200, 2000),
('/api/v1/users', 'POST', 'Yeni kullanıcı oluştur', 'users', true, 20, 200),
('/api/v1/users/{id}', 'GET', 'Kullanıcı detaylarını getir', 'users', true, 500, 5000),
('/api/v1/users/{id}', 'PUT', 'Kullanıcı güncelle', 'users', true, 100, 1000),
('/api/v1/users/{id}', 'DELETE', 'Kullanıcı sil', 'users', true, 20, 200),
('/api/v1/projects', 'GET', 'Proje listesini getir', 'projects', true, 300, 3000),
('/api/v1/projects', 'POST', 'Yeni proje oluştur', 'projects', true, 30, 300),
('/api/v1/projects/{id}', 'GET', 'Proje detaylarını getir', 'projects', true, 500, 5000),
('/api/v1/projects/{id}', 'PUT', 'Proje güncelle', 'projects', true, 100, 1000),
('/api/v1/projects/{id}', 'DELETE', 'Proje sil', 'projects', true, 20, 200),
('/api/v1/personnel', 'GET', 'Personel listesini getir', 'personnel', true, 200, 2000),
('/api/v1/personnel', 'POST', 'Yeni personel ekle', 'personnel', true, 50, 500),
('/api/v1/personnel/{id}', 'GET', 'Personel detaylarını getir', 'personnel', true, 500, 5000),
('/api/v1/personnel/{id}', 'PUT', 'Personel güncelle', 'personnel', true, 100, 1000),
('/api/v1/personnel/{id}', 'DELETE', 'Personel sil', 'personnel', true, 20, 200),
('/api/v1/checkpoints', 'GET', 'Kontrol noktası listesini getir', 'checkpoints', true, 200, 2000),
('/api/v1/checkpoints', 'POST', 'Yeni kontrol noktası oluştur', 'checkpoints', true, 50, 500),
('/api/v1/checkpoints/{id}', 'GET', 'Kontrol noktası detaylarını getir', 'checkpoints', true, 500, 5000),
('/api/v1/checkpoints/{id}', 'PUT', 'Kontrol noktası güncelle', 'checkpoints', true, 100, 1000),
('/api/v1/checkpoints/{id}', 'DELETE', 'Kontrol noktası sil', 'checkpoints', true, 20, 200),
('/api/v1/patrols', 'GET', 'Devriye listesini getir', 'patrols', true, 200, 2000),
('/api/v1/patrols', 'POST', 'Yeni devriye oluştur', 'patrols', true, 50, 500),
('/api/v1/patrols/{id}', 'GET', 'Devriye detaylarını getir', 'patrols', true, 500, 5000),
('/api/v1/patrols/{id}', 'PUT', 'Devriye güncelle', 'patrols', true, 100, 1000),
('/api/v1/patrols/{id}', 'DELETE', 'Devriye sil', 'patrols', true, 20, 200),
('/api/v1/incidents', 'GET', 'Olay listesini getir', 'incidents', true, 200, 2000),
('/api/v1/incidents', 'POST', 'Yeni olay oluştur', 'incidents', true, 50, 500),
('/api/v1/incidents/{id}', 'GET', 'Olay detaylarını getir', 'incidents', true, 500, 5000),
('/api/v1/incidents/{id}', 'PUT', 'Olay güncelle', 'incidents', true, 100, 1000),
('/api/v1/incidents/{id}', 'DELETE', 'Olay sil', 'incidents', true, 20, 200),
('/api/v1/reports', 'GET', 'Rapor listesini getir', 'reports', true, 100, 1000),
('/api/v1/reports/{type}', 'GET', 'Belirli tipte rapor getir', 'reports', true, 200, 2000),
('/api/v1/analytics', 'GET', 'Analitik verileri getir', 'analytics', true, 100, 1000),
('/api/v1/health', 'GET', 'Sistem sağlık durumu', 'system', false, 1000, 10000);
