-- Devriye yönetimi tabloları

-- Devriyeler tablosu
CREATE TABLE IF NOT EXISTS patrols (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    personnel_id UUID REFERENCES personnel(id) ON DELETE SET NULL,
    task_name VARCHAR(255) NOT NULL,
    description TEXT,
    repetition VARCHAR(20) NOT NULL DEFAULT 'daily' CHECK (repetition IN ('daily', 'weekly', 'monthly', 'custom')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'individual' CHECK (type IN ('individual', 'shared', 'team')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'partial', 'missed', 'cancelled')),
    scheduled_date DATE NOT NULL,
    completed_date DATE,
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    completed_by UUID REFERENCES auth.users(id)
);

-- Devriye kontrol noktaları tablosu
CREATE TABLE IF NOT EXISTS patrol_control_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patrol_id UUID NOT NULL REFERENCES patrols(id) ON DELETE CASCADE,
    checkpoint_id UUID NOT NULL REFERENCES checkpoints(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_required BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Devriye geçmişi tablosu
CREATE TABLE IF NOT EXISTS patrol_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patrol_id UUID NOT NULL REFERENCES patrols(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL CHECK (action IN ('created', 'started', 'completed', 'cancelled', 'updated')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Devriye şablonları tablosu
CREATE TABLE IF NOT EXISTS patrol_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    repetition VARCHAR(20) NOT NULL DEFAULT 'daily',
    type VARCHAR(20) NOT NULL DEFAULT 'individual',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Devriye şablon kontrol noktaları tablosu
CREATE TABLE IF NOT EXISTS patrol_template_control_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES patrol_templates(id) ON DELETE CASCADE,
    checkpoint_id UUID NOT NULL REFERENCES checkpoints(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL DEFAULT 0,
    is_required BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS politikaları
ALTER TABLE patrols ENABLE ROW LEVEL SECURITY;
ALTER TABLE patrol_control_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE patrol_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE patrol_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE patrol_template_control_points ENABLE ROW LEVEL SECURITY;

-- Super admin için tüm devriye verilerini görme yetkisi
CREATE POLICY "Super admin can view all patrols" ON patrols
    FOR ALL USING (true);

CREATE POLICY "Super admin can view all patrol control points" ON patrol_control_points
    FOR ALL USING (true);

CREATE POLICY "Super admin can view all patrol history" ON patrol_history
    FOR ALL USING (true);

CREATE POLICY "Super admin can view all patrol templates" ON patrol_templates
    FOR ALL USING (true);

CREATE POLICY "Super admin can view all patrol template control points" ON patrol_template_control_points
    FOR ALL USING (true);

-- Tenant bazlı erişim politikaları
CREATE POLICY "Tenant users can view their patrols" ON patrols
    FOR SELECT USING (tenant_id IN (
        SELECT id FROM tenants WHERE id = auth.jwt() ->> 'tenant_id'
    ));

CREATE POLICY "Tenant users can view their patrol control points" ON patrol_control_points
    FOR SELECT USING (patrol_id IN (
        SELECT id FROM patrols WHERE tenant_id = auth.jwt() ->> 'tenant_id'
    ));

CREATE POLICY "Tenant users can view their patrol history" ON patrol_history
    FOR SELECT USING (patrol_id IN (
        SELECT id FROM patrols WHERE tenant_id = auth.jwt() ->> 'tenant_id'
    ));

CREATE POLICY "Tenant users can view their patrol templates" ON patrol_templates
    FOR SELECT USING (tenant_id = auth.jwt() ->> 'tenant_id');

CREATE POLICY "Tenant users can view their patrol template control points" ON patrol_template_control_points
    FOR SELECT USING (template_id IN (
        SELECT id FROM patrol_templates WHERE tenant_id = auth.jwt() ->> 'tenant_id'
    ));

-- Indexler
CREATE INDEX IF NOT EXISTS idx_patrols_tenant_id ON patrols(tenant_id);
CREATE INDEX IF NOT EXISTS idx_patrols_project_id ON patrols(project_id);
CREATE INDEX IF NOT EXISTS idx_patrols_personnel_id ON patrols(personnel_id);
CREATE INDEX IF NOT EXISTS idx_patrols_status ON patrols(status);
CREATE INDEX IF NOT EXISTS idx_patrols_scheduled_date ON patrols(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_patrols_type ON patrols(type);
CREATE INDEX IF NOT EXISTS idx_patrols_repetition ON patrols(repetition);

CREATE INDEX IF NOT EXISTS idx_patrol_control_points_patrol_id ON patrol_control_points(patrol_id);
CREATE INDEX IF NOT EXISTS idx_patrol_control_points_checkpoint_id ON patrol_control_points(checkpoint_id);
CREATE INDEX IF NOT EXISTS idx_patrol_control_points_order ON patrol_control_points(order_index);

CREATE INDEX IF NOT EXISTS idx_patrol_history_patrol_id ON patrol_history(patrol_id);
CREATE INDEX IF NOT EXISTS idx_patrol_history_created_at ON patrol_history(created_at);

CREATE INDEX IF NOT EXISTS idx_patrol_templates_tenant_id ON patrol_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_patrol_templates_project_id ON patrol_templates(project_id);
CREATE INDEX IF NOT EXISTS idx_patrol_templates_active ON patrol_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_patrol_template_control_points_template_id ON patrol_template_control_points(template_id);
CREATE INDEX IF NOT EXISTS idx_patrol_template_control_points_order ON patrol_template_control_points(order_index);

-- Trigger fonksiyonları
CREATE OR REPLACE FUNCTION update_patrols_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_patrol_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION log_patrol_history()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO patrol_history (patrol_id, action, created_by)
        VALUES (NEW.id, 'created', NEW.created_by);
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status IS DISTINCT FROM NEW.status THEN
            INSERT INTO patrol_history (patrol_id, action, created_by)
            VALUES (NEW.id, NEW.status, NEW.updated_by);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger'lar
CREATE TRIGGER update_patrols_updated_at
    BEFORE UPDATE ON patrols
    FOR EACH ROW
    EXECUTE FUNCTION update_patrols_updated_at();

CREATE TRIGGER update_patrol_templates_updated_at
    BEFORE UPDATE ON patrol_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_patrol_templates_updated_at();

CREATE TRIGGER log_patrol_history
    AFTER INSERT OR UPDATE ON patrols
    FOR EACH ROW
    EXECUTE FUNCTION log_patrol_history();

-- Devriye oluşturma fonksiyonu
CREATE OR REPLACE FUNCTION create_patrol_from_template(
    template_id_param UUID,
    scheduled_date_param DATE,
    personnel_id_param UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    patrol_id UUID;
    template_record RECORD;
    control_point RECORD;
BEGIN
    -- Şablon bilgilerini al
    SELECT * INTO template_record
    FROM patrol_templates
    WHERE id = template_id_param;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Devriye şablonu bulunamadı';
    END IF;
    
    -- Devriye oluştur
    INSERT INTO patrols (
        tenant_id,
        project_id,
        personnel_id,
        task_name,
        description,
        repetition,
        start_time,
        end_time,
        type,
        scheduled_date,
        created_by
    ) VALUES (
        template_record.tenant_id,
        template_record.project_id,
        personnel_id_param,
        template_record.name,
        template_record.description,
        template_record.repetition,
        template_record.start_time,
        template_record.end_time,
        template_record.type,
        scheduled_date_param,
        template_record.created_by
    ) RETURNING id INTO patrol_id;
    
    -- Kontrol noktalarını kopyala
    FOR control_point IN
        SELECT checkpoint_id, order_index, is_required
        FROM patrol_template_control_points
        WHERE template_id = template_id_param
        ORDER BY order_index
    LOOP
        INSERT INTO patrol_control_points (
            patrol_id,
            checkpoint_id,
            order_index,
            is_required
        ) VALUES (
            patrol_id,
            control_point.checkpoint_id,
            control_point.order_index,
            control_point.is_required
        );
    END LOOP;
    
    RETURN patrol_id;
END;
$$ LANGUAGE plpgsql;
