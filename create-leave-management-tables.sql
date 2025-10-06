-- İzin yönetimi için tablolar oluştur

-- 1. İzin türleri tablosu
CREATE TABLE IF NOT EXISTS leave_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(10) NOT NULL, -- MI, DR, BT, EI, ÖI, HI, DI, BI, DG, HT, Üİ, MG
  name VARCHAR(100) NOT NULL, -- Mazeret İzni, Doktor Raporu, vb.
  description TEXT,
  is_paid BOOLEAN DEFAULT false, -- Ücretli mi ücretsiz mi
  max_days_per_year INTEGER, -- Yıllık maksimum gün sayısı
  requires_approval BOOLEAN DEFAULT true, -- Onay gerekiyor mu
  color VARCHAR(7) DEFAULT '#ff9800', -- Renk kodu
  is_active BOOLEAN DEFAULT true,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint for code + tenant_id combination
  CONSTRAINT unique_leave_type_code_per_tenant UNIQUE (code, tenant_id)
);

-- 2. Personel izinleri tablosu
CREATE TABLE IF NOT EXISTS personnel_leaves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  personnel_id UUID NOT NULL REFERENCES personnel(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days INTEGER NOT NULL, -- Toplam izin günü
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, cancelled
  reason TEXT, -- İzin sebebi
  operation_notes TEXT, -- Operasyon notları
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  rejected_reason TEXT, -- Red sebebi
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Constraints
  CONSTRAINT check_end_date_after_start_date CHECK (end_date >= start_date),
  CONSTRAINT check_status_values CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled'))
);

-- 3. İzin günleri tablosu (her gün için ayrı kayıt)
CREATE TABLE IF NOT EXISTS leave_days (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  leave_id UUID NOT NULL REFERENCES personnel_leaves(id) ON DELETE CASCADE,
  personnel_id UUID NOT NULL REFERENCES personnel(id) ON DELETE CASCADE,
  leave_date DATE NOT NULL,
  leave_type_code VARCHAR(10) NOT NULL, -- MI, DR, vb.
  is_weekend BOOLEAN DEFAULT false,
  is_holiday BOOLEAN DEFAULT false,
  replacement_personnel_id UUID REFERENCES personnel(id), -- Yerine geçen personel
  replacement_type VARCHAR(20) DEFAULT 'none', -- none, personnel, joker
  joker_info JSONB, -- Joker personel bilgileri
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT check_replacement_type CHECK (replacement_type IN ('none', 'personnel', 'joker'))
);

-- 4. İzin onayları tablosu (çoklu onay için)
CREATE TABLE IF NOT EXISTS leave_approvals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  leave_id UUID NOT NULL REFERENCES personnel_leaves(id) ON DELETE CASCADE,
  approver_id UUID NOT NULL REFERENCES auth.users(id),
  approval_level INTEGER NOT NULL, -- 1, 2, 3 vb.
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
  comments TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT check_approval_status CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Indexler
CREATE INDEX IF NOT EXISTS idx_personnel_leaves_personnel_id ON personnel_leaves(personnel_id);
CREATE INDEX IF NOT EXISTS idx_personnel_leaves_status ON personnel_leaves(status);
CREATE INDEX IF NOT EXISTS idx_personnel_leaves_dates ON personnel_leaves(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_leave_days_personnel_date ON leave_days(personnel_id, leave_date);
CREATE INDEX IF NOT EXISTS idx_leave_days_leave_id ON leave_days(leave_id);

-- Varsayılan izin türlerini ekle
INSERT INTO leave_types (code, name, description, is_paid, color, tenant_id) VALUES
('MI', 'Mazeret İzni', 'Kişisel mazeretler için izin', false, '#ff9800', (SELECT id FROM tenants LIMIT 1)),
('DR', 'Doktor Raporu', 'Sağlık sorunları için doktor raporu', true, '#2196f3', (SELECT id FROM tenants LIMIT 1)),
('BT', 'Bayram Tatili', 'Resmi bayram tatilleri', true, '#ff5722', (SELECT id FROM tenants LIMIT 1)),
('EI', 'Evlilik İzni', 'Evlilik için izin', true, '#4caf50', (SELECT id FROM tenants LIMIT 1)),
('ÖI', 'Ölüm İzni', 'Yakın akraba ölümü için izin', true, '#607d8b', (SELECT id FROM tenants LIMIT 1)),
('HI', 'Hastalık İzni', 'Hastalık için izin', true, '#9c27b0', (SELECT id FROM tenants LIMIT 1)),
('DI', 'Doğum İzni', 'Doğum için izin', true, '#e1bee7', (SELECT id FROM tenants LIMIT 1)),
('BI', 'Babalık İzni', 'Baba olma için izin', true, '#00bcd4', (SELECT id FROM tenants LIMIT 1)),
('DG', 'Doğum Günü', 'Doğum günü izni', false, '#ffc107', (SELECT id FROM tenants LIMIT 1)),
('HT', 'Hafta Tatili', 'Hafta sonu tatili', true, '#9c27b0', (SELECT id FROM tenants LIMIT 1)),
('Üİ', 'Ücretsiz İzin', 'Ücretsiz izin', false, '#03a9f4', (SELECT id FROM tenants LIMIT 1)),
('MG', 'Mazer. Gelmemez', 'Mazeretsiz gelmeme', false, '#ffeb3b', (SELECT id FROM tenants LIMIT 1))
ON CONFLICT (code, tenant_id) DO NOTHING;
