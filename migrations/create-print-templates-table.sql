-- Drop existing table if exists
DROP TABLE IF EXISTS print_templates CASCADE;

-- Yazdırma şablonları tablosu
CREATE TABLE print_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'quote', -- quote, invoice, receipt
    description TEXT,
    elements JSONB NOT NULL DEFAULT '[]'::JSONB, -- Template elements array
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false, -- Default template for this type
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Yazdırma şablonları için RLS
ALTER TABLE print_templates ENABLE ROW LEVEL SECURITY;

-- Super admin için tüm şablonları görme yetkisi
CREATE POLICY "Super admin can view all print templates" ON print_templates
    FOR ALL USING (true);

-- Tenant bazlı erişim politikaları
CREATE POLICY "Tenant users can view their print templates" ON print_templates
    FOR SELECT USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "Tenant users can insert their print templates" ON print_templates
    FOR INSERT WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "Tenant users can update their print templates" ON print_templates
    FOR UPDATE USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "Tenant users can delete their print templates" ON print_templates
    FOR DELETE USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_print_templates_tenant_id ON print_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_print_templates_type ON print_templates(type);
CREATE INDEX IF NOT EXISTS idx_print_templates_is_default ON print_templates(is_default);
