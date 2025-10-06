-- Olay yönetimi tabloları

-- Olaylar tablosu
CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    serial_no INTEGER NOT NULL,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    personnel_id UUID REFERENCES personnel(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved', 'closed', 'cancelled')),
    priority VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    category VARCHAR(50) NOT NULL DEFAULT 'security' CHECK (category IN ('security', 'maintenance', 'safety', 'equipment', 'personnel', 'other')),
    location VARCHAR(255),
    incident_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolution_date TIMESTAMP WITH TIME ZONE,
    documents TEXT[],
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    assigned_to UUID REFERENCES auth.users(id),
    resolved_by UUID REFERENCES auth.users(id)
);

-- Olay yorumları tablosu
CREATE TABLE IF NOT EXISTS incident_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Olay durumu geçmişi tablosu
CREATE TABLE IF NOT EXISTS incident_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    old_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Olay kategorileri tablosu
CREATE TABLE IF NOT EXISTS incident_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#1976d2',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS politikaları
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_categories ENABLE ROW LEVEL SECURITY;

-- Super admin için tüm olay verilerini görme yetkisi
CREATE POLICY "Super admin can view all incidents" ON incidents
    FOR ALL USING (true);

CREATE POLICY "Super admin can view all incident comments" ON incident_comments
    FOR ALL USING (true);

CREATE POLICY "Super admin can view all incident status history" ON incident_status_history
    FOR ALL USING (true);

CREATE POLICY "Super admin can view all incident categories" ON incident_categories
    FOR ALL USING (true);

-- Tenant bazlı erişim politikaları
CREATE POLICY "Tenant users can view their incidents" ON incidents
    FOR SELECT USING (tenant_id IN (
        SELECT id FROM tenants WHERE id = auth.jwt() ->> 'tenant_id'
    ));

CREATE POLICY "Tenant users can view their incident comments" ON incident_comments
    FOR SELECT USING (incident_id IN (
        SELECT id FROM incidents WHERE tenant_id = auth.jwt() ->> 'tenant_id'
    ));

CREATE POLICY "Tenant users can view their incident status history" ON incident_status_history
    FOR SELECT USING (incident_id IN (
        SELECT id FROM incidents WHERE tenant_id = auth.jwt() ->> 'tenant_id'
    ));

-- Indexler
CREATE INDEX IF NOT EXISTS idx_incidents_tenant_id ON incidents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_incidents_project_id ON incidents(project_id);
CREATE INDEX IF NOT EXISTS idx_incidents_personnel_id ON incidents(personnel_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_priority ON incidents(priority);
CREATE INDEX IF NOT EXISTS idx_incidents_category ON incidents(category);
CREATE INDEX IF NOT EXISTS idx_incidents_incident_date ON incidents(incident_date);
CREATE INDEX IF NOT EXISTS idx_incidents_serial_no ON incidents(serial_no);

CREATE INDEX IF NOT EXISTS idx_incident_comments_incident_id ON incident_comments(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_comments_created_at ON incident_comments(created_at);

CREATE INDEX IF NOT EXISTS idx_incident_status_history_incident_id ON incident_status_history(incident_id);
CREATE INDEX IF NOT EXISTS idx_incident_status_history_created_at ON incident_status_history(created_at);

-- Trigger fonksiyonları
CREATE OR REPLACE FUNCTION update_incidents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_incident_status_history()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO incident_status_history (
            incident_id,
            old_status,
            new_status,
            created_by
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            NEW.updated_by
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_incident_serial_no()
RETURNS TRIGGER AS $$
DECLARE
    next_serial INTEGER;
BEGIN
    SELECT COALESCE(MAX(serial_no), 0) + 1 INTO next_serial
    FROM incidents
    WHERE tenant_id = NEW.tenant_id;
    
    NEW.serial_no = next_serial;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger'lar
CREATE TRIGGER update_incidents_updated_at
    BEFORE UPDATE ON incidents
    FOR EACH ROW
    EXECUTE FUNCTION update_incidents_updated_at();

CREATE TRIGGER update_incident_status_history
    AFTER UPDATE ON incidents
    FOR EACH ROW
    EXECUTE FUNCTION update_incident_status_history();

CREATE TRIGGER generate_incident_serial_no
    BEFORE INSERT ON incidents
    FOR EACH ROW
    EXECUTE FUNCTION generate_incident_serial_no();

-- Varsayılan olay kategorileri
INSERT INTO incident_categories (name, description, color) VALUES
('Güvenlik', 'Güvenlik ile ilgili olaylar', '#f44336'),
('Bakım', 'Bakım ve onarım olayları', '#ff9800'),
('Güvenlik', 'İş güvenliği olayları', '#4caf50'),
('Ekipman', 'Ekipman arızaları', '#2196f3'),
('Personel', 'Personel ile ilgili olaylar', '#9c27b0'),
('Diğer', 'Diğer kategoriler', '#795548')
ON CONFLICT (name) DO NOTHING;
