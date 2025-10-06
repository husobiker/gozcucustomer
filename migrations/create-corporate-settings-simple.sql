-- Basit Corporate Settings Tablosu
-- RLS politikaları olmadan, sadece temel tablo

CREATE TABLE IF NOT EXISTS corporate_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Şirket Bilgileri
    company_name VARCHAR(255),
    company_full_name TEXT,
    company_address TEXT,
    company_phone VARCHAR(50),
    company_email VARCHAR(255),
    company_website VARCHAR(255),
    tax_number VARCHAR(50),
    tax_office VARCHAR(255),
    
    -- Logo ve Branding
    logo_url TEXT,
    logo_alt_text VARCHAR(255),
    favicon_url TEXT,
    
    -- Renk Ayarları
    primary_color VARCHAR(7) DEFAULT '#1976d2',
    secondary_color VARCHAR(7) DEFAULT '#42a5f5',
    accent_color VARCHAR(7) DEFAULT '#ff9800',
    
    -- Footer Ayarları
    footer_text TEXT,
    footer_links JSONB DEFAULT '[]'::jsonb,
    
    -- Sistem Ayarları
    timezone VARCHAR(50) DEFAULT 'Europe/Istanbul',
    date_format VARCHAR(20) DEFAULT 'DD/MM/YYYY',
    time_format VARCHAR(10) DEFAULT '24',
    currency VARCHAR(3) DEFAULT 'TRY',
    language VARCHAR(5) DEFAULT 'tr',
    
    -- SEO Ayarları
    meta_title VARCHAR(255),
    meta_description TEXT,
    meta_keywords TEXT,
    
    -- Yazılım Bilgileri
    software_name VARCHAR(100) DEFAULT 'Gözcü360°',
    software_version VARCHAR(20) DEFAULT '1.0.0',
    
    -- Zaman Damgaları
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint - her tenant için sadece bir kayıt olabilir
    UNIQUE(tenant_id)
);

-- Index oluştur
CREATE INDEX IF NOT EXISTS idx_corporate_settings_tenant_id ON corporate_settings(tenant_id);

-- RLS (Row Level Security) politikaları
ALTER TABLE corporate_settings ENABLE ROW LEVEL SECURITY;

-- Tenant bazlı erişim politikası
CREATE POLICY "Users can view their own corporate settings" ON corporate_settings
    FOR SELECT USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "Users can insert their own corporate settings" ON corporate_settings
    FOR INSERT WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "Users can update their own corporate settings" ON corporate_settings
    FOR UPDATE USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "Users can delete their own corporate settings" ON corporate_settings
    FOR DELETE USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Admin kullanıcıları için tam erişim
CREATE POLICY "Admins can do everything on corporate_settings" ON corporate_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users u 
            WHERE u.tenant_id = corporate_settings.tenant_id 
            AND u.id = auth.uid()
            AND u.role = 'admin'
        )
    );

-- Updated_at otomatik güncelleme trigger'ı
CREATE OR REPLACE FUNCTION update_corporate_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Önce mevcut trigger'ı sil
DROP TRIGGER IF EXISTS trigger_update_corporate_settings_updated_at ON corporate_settings;

-- Yeni trigger'ı oluştur
CREATE TRIGGER trigger_update_corporate_settings_updated_at
    BEFORE UPDATE ON corporate_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_corporate_settings_updated_at();
