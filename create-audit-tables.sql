-- Audit logları tabloları oluşturma

-- Kullanıcı aktivite logları tablosu
CREATE TABLE IF NOT EXISTS user_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    tenant_id UUID REFERENCES tenants(id),
    action VARCHAR(100) NOT NULL, -- login, logout, create, update, delete, view, etc.
    resource_type VARCHAR(50) NOT NULL, -- user, tenant, project, personnel, etc.
    resource_id UUID,
    resource_name VARCHAR(255),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255),
    request_url TEXT,
    request_method VARCHAR(10),
    response_status INTEGER,
    duration_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sistem değişiklik logları tablosu
CREATE TABLE IF NOT EXISTS system_change_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    changed_by UUID REFERENCES auth.users(id),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    operation VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
    old_values JSONB,
    new_values JSONB,
    changed_columns TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Güvenlik logları tablosu
CREATE TABLE IF NOT EXISTS security_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    tenant_id UUID REFERENCES tenants(id),
    event_type VARCHAR(50) NOT NULL, -- login_failed, password_changed, suspicious_activity, etc.
    severity VARCHAR(20) NOT NULL, -- low, medium, high, critical
    description TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    location VARCHAR(255),
    additional_data JSONB,
    resolved BOOLEAN DEFAULT false,
    resolved_by UUID REFERENCES auth.users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API kullanım logları tablosu
CREATE TABLE IF NOT EXISTS api_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    tenant_id UUID REFERENCES tenants(id),
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    request_body JSONB,
    response_body JSONB,
    status_code INTEGER NOT NULL,
    response_time_ms INTEGER,
    ip_address INET,
    user_agent TEXT,
    api_key_id UUID,
    rate_limit_remaining INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Veri erişim logları tablosu
CREATE TABLE IF NOT EXISTS data_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    tenant_id UUID REFERENCES tenants(id),
    table_name VARCHAR(100) NOT NULL,
    operation VARCHAR(20) NOT NULL, -- SELECT, INSERT, UPDATE, DELETE
    record_count INTEGER,
    filters JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS politikaları
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_change_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_access_logs ENABLE ROW LEVEL SECURITY;

-- Super admin için tüm audit loglarını görme yetkisi
CREATE POLICY "Super admin can view all user activity logs" ON user_activity_logs
    FOR ALL USING (true);

CREATE POLICY "Super admin can view all system change logs" ON system_change_logs
    FOR ALL USING (true);

CREATE POLICY "Super admin can view all security logs" ON security_logs
    FOR ALL USING (true);

CREATE POLICY "Super admin can view all api usage logs" ON api_usage_logs
    FOR ALL USING (true);

CREATE POLICY "Super admin can view all data access logs" ON data_access_logs
    FOR ALL USING (true);

-- Indexler
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_tenant_id ON user_activity_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_action ON user_activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON user_activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_system_change_logs_table_name ON system_change_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_system_change_logs_created_at ON system_change_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_severity ON security_logs(severity);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON security_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_endpoint ON api_usage_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_created_at ON api_usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_data_access_logs_table_name ON data_access_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_data_access_logs_created_at ON data_access_logs(created_at);

-- Audit log oluşturma fonksiyonları
CREATE OR REPLACE FUNCTION log_user_activity(
    user_id_param UUID,
    tenant_id_param UUID,
    action_param VARCHAR(100),
    resource_type_param VARCHAR(50),
    resource_id_param UUID DEFAULT NULL,
    resource_name_param VARCHAR(255) DEFAULT NULL,
    old_values_param JSONB DEFAULT NULL,
    new_values_param JSONB DEFAULT NULL,
    ip_address_param INET DEFAULT NULL,
    user_agent_param TEXT DEFAULT NULL,
    session_id_param VARCHAR(255) DEFAULT NULL,
    request_url_param TEXT DEFAULT NULL,
    request_method_param VARCHAR(10) DEFAULT NULL,
    response_status_param INTEGER DEFAULT NULL,
    duration_ms_param INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO user_activity_logs (
        user_id, tenant_id, action, resource_type, resource_id, resource_name,
        old_values, new_values, ip_address, user_agent, session_id,
        request_url, request_method, response_status, duration_ms
    ) VALUES (
        user_id_param, tenant_id_param, action_param, resource_type_param, resource_id_param,
        resource_name_param, old_values_param, new_values_param, ip_address_param,
        user_agent_param, session_id_param, request_url_param, request_method_param,
        response_status_param, duration_ms_param
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION log_system_change(
    changed_by_param UUID,
    table_name_param VARCHAR(100),
    record_id_param UUID,
    operation_param VARCHAR(20),
    old_values_param JSONB DEFAULT NULL,
    new_values_param JSONB DEFAULT NULL,
    changed_columns_param TEXT[] DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO system_change_logs (
        changed_by, table_name, record_id, operation, old_values, new_values, changed_columns
    ) VALUES (
        changed_by_param, table_name_param, record_id_param, operation_param,
        old_values_param, new_values_param, changed_columns_param
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION log_security_event(
    user_id_param UUID,
    tenant_id_param UUID,
    event_type_param VARCHAR(50),
    severity_param VARCHAR(20),
    description_param TEXT,
    ip_address_param INET DEFAULT NULL,
    user_agent_param TEXT DEFAULT NULL,
    location_param VARCHAR(255) DEFAULT NULL,
    additional_data_param JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO security_logs (
        user_id, tenant_id, event_type, severity, description, ip_address,
        user_agent, location, additional_data
    ) VALUES (
        user_id_param, tenant_id_param, event_type_param, severity_param,
        description_param, ip_address_param, user_agent_param, location_param,
        additional_data_param
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION log_api_usage(
    user_id_param UUID,
    tenant_id_param UUID,
    endpoint_param VARCHAR(255),
    method_param VARCHAR(10),
    request_body_param JSONB DEFAULT NULL,
    response_body_param JSONB DEFAULT NULL,
    status_code_param INTEGER,
    response_time_ms_param INTEGER DEFAULT NULL,
    ip_address_param INET DEFAULT NULL,
    user_agent_param TEXT DEFAULT NULL,
    api_key_id_param UUID DEFAULT NULL,
    rate_limit_remaining_param INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO api_usage_logs (
        user_id, tenant_id, endpoint, method, request_body, response_body,
        status_code, response_time_ms, ip_address, user_agent, api_key_id,
        rate_limit_remaining
    ) VALUES (
        user_id_param, tenant_id_param, endpoint_param, method_param,
        request_body_param, response_body_param, status_code_param,
        response_time_ms_param, ip_address_param, user_agent_param,
        api_key_id_param, rate_limit_remaining_param
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION log_data_access(
    user_id_param UUID,
    tenant_id_param UUID,
    table_name_param VARCHAR(100),
    operation_param VARCHAR(20),
    record_count_param INTEGER DEFAULT NULL,
    filters_param JSONB DEFAULT NULL,
    ip_address_param INET DEFAULT NULL,
    user_agent_param TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO data_access_logs (
        user_id, tenant_id, table_name, operation, record_count, filters,
        ip_address, user_agent
    ) VALUES (
        user_id_param, tenant_id_param, table_name_param, operation_param,
        record_count_param, filters_param, ip_address_param, user_agent_param
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger fonksiyonları (otomatik audit log oluşturma)
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    old_data JSONB;
    new_data JSONB;
    changed_columns TEXT[] := '{}';
    column_name TEXT;
BEGIN
    -- Eski ve yeni verileri JSON olarak al
    IF TG_OP = 'DELETE' THEN
        old_data = to_jsonb(OLD);
        new_data = NULL;
    ELSIF TG_OP = 'INSERT' THEN
        old_data = NULL;
        new_data = to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        old_data = to_jsonb(OLD);
        new_data = to_jsonb(NEW);
        
        -- Değişen kolonları bul
        FOR column_name IN SELECT unnest(array(SELECT key FROM jsonb_each(to_jsonb(NEW)))) LOOP
            IF (old_data->column_name) IS DISTINCT FROM (new_data->column_name) THEN
                changed_columns = array_append(changed_columns, column_name);
            END IF;
        END LOOP;
    END IF;
    
    -- System change log oluştur
    PERFORM log_system_change(
        COALESCE(NEW.updated_by, OLD.updated_by, NEW.created_by, OLD.created_by),
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        old_data,
        new_data,
        changed_columns
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Önemli tablolar için audit trigger'ları oluştur
CREATE TRIGGER audit_tenants_trigger
    AFTER INSERT OR UPDATE OR DELETE ON tenants
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_users_trigger
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_invoices_trigger
    AFTER INSERT OR UPDATE OR DELETE ON invoices
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_payments_trigger
    AFTER INSERT OR UPDATE OR DELETE ON payments
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Audit log temizleme fonksiyonu (eski logları sil)
CREATE OR REPLACE FUNCTION cleanup_audit_logs(retention_days INTEGER DEFAULT 90)
RETURNS VOID AS $$
BEGIN
    -- 90 günden eski logları sil
    DELETE FROM user_activity_logs WHERE created_at < NOW() - (retention_days || ' days')::INTERVAL;
    DELETE FROM system_change_logs WHERE created_at < NOW() - (retention_days || ' days')::INTERVAL;
    DELETE FROM security_logs WHERE created_at < NOW() - (retention_days || ' days')::INTERVAL AND resolved = true;
    DELETE FROM api_usage_logs WHERE created_at < NOW() - (retention_days || ' days')::INTERVAL;
    DELETE FROM data_access_logs WHERE created_at < NOW() - (retention_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- Audit log analiz fonksiyonları
CREATE OR REPLACE FUNCTION get_user_activity_summary(
    user_id_param UUID DEFAULT NULL,
    tenant_id_param UUID DEFAULT NULL,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
    end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
    action VARCHAR(100),
    action_count BIGINT,
    last_activity TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ual.action,
        COUNT(*) as action_count,
        MAX(ual.created_at) as last_activity
    FROM user_activity_logs ual
    WHERE 
        (user_id_param IS NULL OR ual.user_id = user_id_param)
        AND (tenant_id_param IS NULL OR ual.tenant_id = tenant_id_param)
        AND ual.created_at BETWEEN start_date AND end_date
    GROUP BY ual.action
    ORDER BY action_count DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_security_events_summary(
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
    end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
    event_type VARCHAR(50),
    severity VARCHAR(20),
    event_count BIGINT,
    last_event TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sl.event_type,
        sl.severity,
        COUNT(*) as event_count,
        MAX(sl.created_at) as last_event
    FROM security_logs sl
    WHERE sl.created_at BETWEEN start_date AND end_date
    GROUP BY sl.event_type, sl.severity
    ORDER BY event_count DESC;
END;
$$ LANGUAGE plpgsql;
