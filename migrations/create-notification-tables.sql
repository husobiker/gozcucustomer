-- Bildirim sistemi tabloları oluşturma

-- Bildirim şablonları tablosu
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL, -- email, sms, push, in_app
    subject VARCHAR(255),
    body TEXT NOT NULL,
    variables JSONB DEFAULT '{}'::JSONB, -- Kullanılabilir değişkenler
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bildirim kuyruğu tablosu
CREATE TABLE IF NOT EXISTS notification_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES notification_templates(id),
    recipient_type VARCHAR(20) NOT NULL, -- user, tenant, all
    recipient_id UUID, -- user_id veya tenant_id
    recipient_email VARCHAR(255),
    recipient_phone VARCHAR(20),
    subject VARCHAR(255),
    body TEXT NOT NULL,
    variables JSONB DEFAULT '{}'::JSONB,
    priority VARCHAR(10) DEFAULT 'normal', -- low, normal, high, urgent
    status VARCHAR(20) DEFAULT 'pending', -- pending, sent, failed, cancelled
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bildirim geçmişi tablosu
CREATE TABLE IF NOT EXISTS notification_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_id UUID REFERENCES notification_queue(id),
    template_id UUID REFERENCES notification_templates(id),
    recipient_type VARCHAR(20) NOT NULL,
    recipient_id UUID,
    recipient_email VARCHAR(255),
    recipient_phone VARCHAR(20),
    subject VARCHAR(255),
    body TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    error_message TEXT,
    delivery_attempts INTEGER DEFAULT 1
);

-- Bildirim ayarları tablosu
CREATE TABLE IF NOT EXISTS notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id),
    user_id UUID REFERENCES auth.users(id),
    notification_type VARCHAR(50) NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    email_enabled BOOLEAN DEFAULT true,
    sms_enabled BOOLEAN DEFAULT false,
    push_enabled BOOLEAN DEFAULT true,
    in_app_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, user_id, notification_type)
);

-- Sistem bildirimleri tablosu
CREATE TABLE IF NOT EXISTS system_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL, -- maintenance, security, billing, system
    severity VARCHAR(20) NOT NULL, -- info, warning, error, critical
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    target_audience VARCHAR(20) DEFAULT 'all', -- all, admins, tenants, users
    is_global BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS politikaları
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_notifications ENABLE ROW LEVEL SECURITY;

-- Super admin için tüm bildirimleri görme yetkisi
CREATE POLICY "Super admin can view all notification templates" ON notification_templates
    FOR ALL USING (true);

CREATE POLICY "Super admin can view all notification queue" ON notification_queue
    FOR ALL USING (true);

CREATE POLICY "Super admin can view all notification history" ON notification_history
    FOR ALL USING (true);

CREATE POLICY "Super admin can view all notification settings" ON notification_settings
    FOR ALL USING (true);

CREATE POLICY "Super admin can view all system notifications" ON system_notifications
    FOR ALL USING (true);

-- Indexler
CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON notification_queue(status);
CREATE INDEX IF NOT EXISTS idx_notification_queue_scheduled_at ON notification_queue(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_notification_queue_recipient ON notification_queue(recipient_type, recipient_id);
CREATE INDEX IF NOT EXISTS idx_notification_history_sent_at ON notification_history(sent_at);
CREATE INDEX IF NOT EXISTS idx_notification_history_recipient ON notification_history(recipient_type, recipient_id);
CREATE INDEX IF NOT EXISTS idx_system_notifications_active ON system_notifications(is_active, start_date, end_date);

-- Trigger fonksiyonları
CREATE OR REPLACE FUNCTION update_notification_template_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_notification_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_system_notification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger'lar
CREATE TRIGGER update_notification_templates_updated_at
    BEFORE UPDATE ON notification_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_template_updated_at();

CREATE TRIGGER update_notification_settings_updated_at
    BEFORE UPDATE ON notification_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_settings_updated_at();

CREATE TRIGGER update_system_notifications_updated_at
    BEFORE UPDATE ON system_notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_system_notification_updated_at();

-- Bildirim gönderme fonksiyonu
CREATE OR REPLACE FUNCTION send_notification(
    template_name_param VARCHAR(100),
    recipient_type_param VARCHAR(20),
    recipient_id_param UUID DEFAULT NULL,
    recipient_email_param VARCHAR(255) DEFAULT NULL,
    recipient_phone_param VARCHAR(20) DEFAULT NULL,
    variables_param JSONB DEFAULT '{}'::JSONB,
    priority_param VARCHAR(10) DEFAULT 'normal',
    scheduled_at_param TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS UUID AS $$
DECLARE
    template_record RECORD;
    queue_id UUID;
    processed_subject VARCHAR(255);
    processed_body TEXT;
BEGIN
    -- Template'i al
    SELECT * INTO template_record
    FROM notification_templates
    WHERE name = template_name_param AND is_active = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Bildirim şablonu bulunamadı: %', template_name_param;
    END IF;
    
    -- Subject ve body'yi işle (basit değişken değiştirme)
    processed_subject := template_record.subject;
    processed_body := template_record.body;
    
    -- Değişkenleri değiştir (basit string replacement)
    IF variables_param IS NOT NULL THEN
        FOR key, value IN SELECT * FROM jsonb_each_text(variables_param) LOOP
            processed_subject := REPLACE(processed_subject, '{{' || key || '}}', value);
            processed_body := REPLACE(processed_body, '{{' || key || '}}', value);
        END LOOP;
    END IF;
    
    -- Kuyruğa ekle
    INSERT INTO notification_queue (
        template_id,
        recipient_type,
        recipient_id,
        recipient_email,
        recipient_phone,
        subject,
        body,
        variables,
        priority,
        scheduled_at
    ) VALUES (
        template_record.id,
        recipient_type_param,
        recipient_id_param,
        recipient_email_param,
        recipient_phone_param,
        processed_subject,
        processed_body,
        variables_param,
        priority_param,
        scheduled_at_param
    ) RETURNING id INTO queue_id;
    
    RETURN queue_id;
END;
$$ LANGUAGE plpgsql;

-- Toplu bildirim gönderme fonksiyonu
CREATE OR REPLACE FUNCTION send_bulk_notification(
    template_name_param VARCHAR(100),
    tenant_ids UUID[] DEFAULT NULL,
    user_ids UUID[] DEFAULT NULL,
    variables_param JSONB DEFAULT '{}'::JSONB,
    priority_param VARCHAR(10) DEFAULT 'normal'
)
RETURNS INTEGER AS $$
DECLARE
    sent_count INTEGER := 0;
    tenant_id UUID;
    user_id UUID;
BEGIN
    -- Tenant'lara gönder
    IF tenant_ids IS NOT NULL THEN
        FOREACH tenant_id IN ARRAY tenant_ids LOOP
            PERFORM send_notification(
                template_name_param,
                'tenant',
                tenant_id,
                NULL,
                NULL,
                variables_param,
                priority_param
            );
            sent_count := sent_count + 1;
        END LOOP;
    END IF;
    
    -- Kullanıcılara gönder
    IF user_ids IS NOT NULL THEN
        FOREACH user_id IN ARRAY user_ids LOOP
            PERFORM send_notification(
                template_name_param,
                'user',
                user_id,
                NULL,
                NULL,
                variables_param,
                priority_param
            );
            sent_count := sent_count + 1;
        END LOOP;
    END IF;
    
    RETURN sent_count;
END;
$$ LANGUAGE plpgsql;

-- Varsayılan bildirim şablonları
INSERT INTO notification_templates (name, type, subject, body, variables) VALUES
('welcome_email', 'email', 'SafeBase''e Hoş Geldiniz!', 
 'Merhaba {{user_name}},\n\nSafeBase platformuna hoş geldiniz!\n\nGiriş bilgileriniz:\nEmail: {{user_email}}\nŞifre: {{user_password}}\n\nGiriş yapmak için: {{login_url}}\n\nİyi çalışmalar!\nSafeBase Ekibi', 
 '{"user_name": "string", "user_email": "string", "user_password": "string", "login_url": "string"}'::JSONB),

('password_reset', 'email', 'Şifre Sıfırlama', 
 'Merhaba {{user_name}},\n\nŞifreniz başarıyla sıfırlanmıştır.\n\nYeni şifre: {{new_password}}\n\nGüvenliğiniz için lütfen giriş yaptıktan sonra şifrenizi değiştirin.\n\nGiriş yapmak için: {{login_url}}\n\nSafeBase Ekibi', 
 '{"user_name": "string", "new_password": "string", "login_url": "string"}'::JSONB),

('invoice_created', 'email', 'Yeni Fatura Oluşturuldu', 
 'Merhaba {{tenant_name}},\n\n{{subscription_plan}} planınız için yeni fatura oluşturulmuştur.\n\nFatura No: {{invoice_number}}\nTutar: {{amount}} {{currency}}\nVade Tarihi: {{due_date}}\n\nFaturayı görüntülemek için: {{invoice_url}}\n\nSafeBase Ekibi', 
 '{"tenant_name": "string", "subscription_plan": "string", "invoice_number": "string", "amount": "number", "currency": "string", "due_date": "string", "invoice_url": "string"}'::JSONB),

('payment_received', 'email', 'Ödeme Alındı', 
 'Merhaba {{tenant_name}},\n\n{{amount}} {{currency}} tutarındaki ödemeniz başarıyla alınmıştır.\n\nÖdeme Detayları:\nFatura No: {{invoice_number}}\nÖdeme Tarihi: {{payment_date}}\nÖdeme Yöntemi: {{payment_method}}\n\nTeşekkürler!\nSafeBase Ekibi', 
 '{"tenant_name": "string", "amount": "number", "currency": "string", "invoice_number": "string", "payment_date": "string", "payment_method": "string"}'::JSONB),

('system_maintenance', 'email', 'Sistem Bakım Bildirimi', 
 'Merhaba {{recipient_name}},\n\n{{maintenance_type}} bakımı nedeniyle sistem {{start_time}} - {{end_time}} saatleri arasında erişilemeyecektir.\n\nBakım Detayları:\nTür: {{maintenance_type}}\nBaşlangıç: {{start_time}}\nBitiş: {{end_time}}\nAçıklama: {{description}}\n\nAnlayışınız için teşekkürler.\nSafeBase Ekibi', 
 '{"recipient_name": "string", "maintenance_type": "string", "start_time": "string", "end_time": "string", "description": "string"}'::JSONB),

('security_alert', 'email', 'Güvenlik Uyarısı', 
 'Merhaba {{user_name}},\n\nHesabınızda şüpheli aktivite tespit edilmiştir.\n\nDetaylar:\nTarih: {{alert_date}}\nIP Adresi: {{ip_address}}\nLokasyon: {{location}}\nAktivite: {{activity}}\n\nEğer bu işlemi siz yapmadıysanız, lütfen hemen şifrenizi değiştirin.\n\nGüvenlik için: {{security_url}}\n\nSafeBase Güvenlik Ekibi', 
 '{"user_name": "string", "alert_date": "string", "ip_address": "string", "location": "string", "activity": "string", "security_url": "string"}'::JSONB),

('subscription_expiring', 'email', 'Abonelik Süresi Doluyor', 
 'Merhaba {{tenant_name}},\n\n{{subscription_plan}} aboneliğinizin süresi {{days_left}} gün sonra dolacaktır.\n\nAbonelik Detayları:\nPlan: {{subscription_plan}}\nBitiş Tarihi: {{expiry_date}}\nYenileme Tutarı: {{renewal_amount}} {{currency}}\n\nYenilemek için: {{renewal_url}}\n\nSafeBase Ekibi', 
 '{"tenant_name": "string", "subscription_plan": "string", "days_left": "number", "expiry_date": "string", "renewal_amount": "number", "currency": "string", "renewal_url": "string"}'::JSONB);
