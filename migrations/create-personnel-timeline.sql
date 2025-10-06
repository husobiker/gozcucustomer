-- ==============================================
-- PERSONEL ZAMAN TÜNELİ TABLOSU
-- ==============================================

CREATE TABLE IF NOT EXISTS personnel_timeline (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  personnel_id UUID NOT NULL REFERENCES personnel(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Olay Bilgileri
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
    'project_change', 'status_change', 'position_change', 
    'salary_change', 'leave_added', 'leave_cancelled',
    'inventory_assigned', 'inventory_returned', 'bank_account_added',
    'security_card_updated', 'family_member_added', 'training_completed',
    'incident_reported', 'other'
  )),
  event_title VARCHAR(255) NOT NULL,
  event_description TEXT,
  
  -- Değişiklik Detayları
  old_value TEXT, -- Eski değer
  new_value TEXT, -- Yeni değer
  
  -- İlişkili Kayıtlar
  related_project_id UUID REFERENCES projects(id),
  related_user_id UUID REFERENCES users(id),
  
  -- Zaman Damgaları
  event_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Notlar
  notes TEXT
);

-- ==============================================
-- İNDEKSLER (Performans İçin)
-- ==============================================

CREATE INDEX IF NOT EXISTS idx_personnel_timeline_personnel_id ON personnel_timeline(personnel_id);
CREATE INDEX IF NOT EXISTS idx_personnel_timeline_tenant_id ON personnel_timeline(tenant_id);
CREATE INDEX IF NOT EXISTS idx_personnel_timeline_event_type ON personnel_timeline(event_type);
CREATE INDEX IF NOT EXISTS idx_personnel_timeline_event_date ON personnel_timeline(event_date);
CREATE INDEX IF NOT EXISTS idx_personnel_timeline_related_project ON personnel_timeline(related_project_id);

-- ==============================================
-- RLS POLİTİKALARI
-- ==============================================

-- RLS'yi etkinleştir
ALTER TABLE personnel_timeline ENABLE ROW LEVEL SECURITY;

-- Tenant bazlı erişim politikası
CREATE POLICY "personnel_timeline_tenant_policy" ON personnel_timeline
  FOR ALL USING (
    tenant_id IN (
      SELECT id FROM tenants 
      WHERE id = auth.jwt() ->> 'tenant_id'
    )
  );

-- ==============================================
-- YARDIMCI FONKSİYONLAR
-- ==============================================

-- Personel zaman tünelini getir
CREATE OR REPLACE FUNCTION get_personnel_timeline(personnel_uuid UUID)
RETURNS TABLE (
  id UUID,
  event_type VARCHAR,
  event_title VARCHAR,
  event_description TEXT,
  old_value TEXT,
  new_value TEXT,
  event_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  related_project_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pt.id,
    pt.event_type,
    pt.event_title,
    pt.event_description,
    pt.old_value,
    pt.new_value,
    pt.event_date,
    pt.notes,
    p.name as related_project_name
  FROM personnel_timeline pt
  LEFT JOIN projects p ON pt.related_project_id = p.id
  WHERE pt.personnel_id = personnel_uuid 
  ORDER BY pt.event_date DESC;
END;
$$ LANGUAGE plpgsql;

-- Proje değişikliği kaydı ekle
CREATE OR REPLACE FUNCTION log_project_change(
  personnel_uuid UUID,
  tenant_uuid UUID,
  old_project_name TEXT,
  new_project_name TEXT,
  user_uuid UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  timeline_id UUID;
BEGIN
  INSERT INTO personnel_timeline (
    personnel_id,
    tenant_id,
    event_type,
    event_title,
    event_description,
    old_value,
    new_value,
    related_user_id
  ) VALUES (
    personnel_uuid,
    tenant_uuid,
    'project_change',
    'Proje Değişikliği',
    'Personel başka bir projeye transfer edildi',
    old_project_name,
    new_project_name,
    user_uuid
  ) RETURNING id INTO timeline_id;
  
  RETURN timeline_id;
END;
$$ LANGUAGE plpgsql;
