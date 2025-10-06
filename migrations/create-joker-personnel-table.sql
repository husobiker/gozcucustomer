-- Joker personel tablosu oluştur

CREATE TABLE IF NOT EXISTS joker_personnel (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  id_number VARCHAR(11) NOT NULL,
  company_name VARCHAR(200),
  is_active BOOLEAN DEFAULT true,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint for id_number + tenant_id combination
  CONSTRAINT unique_joker_id_number_per_tenant UNIQUE (id_number, tenant_id)
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_joker_personnel_tenant_id ON joker_personnel(tenant_id);
CREATE INDEX IF NOT EXISTS idx_joker_personnel_is_active ON joker_personnel(is_active);
CREATE INDEX IF NOT EXISTS idx_joker_personnel_name ON joker_personnel(name);

-- Örnek joker personel ekle
INSERT INTO joker_personnel (name, phone, id_number, company_name, tenant_id) VALUES
('Ahmet Yılmaz', '0532 123 45 67', '12345678901', 'ABC Güvenlik', '95ba933f-6647-4181-bf57-e50119b13050'),
('Mehmet Kaya', '0533 234 56 78', '12345678902', 'XYZ Güvenlik', '95ba933f-6647-4181-bf57-e50119b13050'),
('Ali Demir', '0534 345 67 89', '12345678903', 'DEF Güvenlik', '95ba933f-6647-4181-bf57-e50119b13050')
ON CONFLICT (id_number, tenant_id) DO NOTHING;

-- Kontrol et
SELECT * FROM joker_personnel WHERE tenant_id = '95ba933f-6647-4181-bf57-e50119b13050';