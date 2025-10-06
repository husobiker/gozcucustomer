-- ==============================================
-- PERSONEL GÜVENLİK KARTLARI TABLOSU
-- ==============================================

CREATE TABLE IF NOT EXISTS personnel_security_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  personnel_id UUID NOT NULL REFERENCES personnel(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Güvenlik Kart Bilgileri
  id_card_number VARCHAR(50), -- Kimlik Kart No
  card_type VARCHAR(20) DEFAULT 'SİLAHLI' CHECK (card_type IN ('SİLAHLI', 'SİLAHSIZ')),
  issue_date DATE DEFAULT NULL, -- Veriliş/Düzenleme Tarihi
  expiry_date DATE DEFAULT NULL, -- Son Geçerlilik Tarihi
  
  -- Durum
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Notlar
  notes TEXT,
  
  -- Zaman Damgaları
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Benzersizlik Kısıtı (Bir personelin birden fazla aktif kartı olabilir)
  UNIQUE(personnel_id, id_card_number)
);

-- ==============================================
-- İNDEKSLER (Performans İçin)
-- ==============================================

CREATE INDEX IF NOT EXISTS idx_personnel_security_cards_personnel_id ON personnel_security_cards(personnel_id);
CREATE INDEX IF NOT EXISTS idx_personnel_security_cards_tenant_id ON personnel_security_cards(tenant_id);
CREATE INDEX IF NOT EXISTS idx_personnel_security_cards_card_type ON personnel_security_cards(card_type);
CREATE INDEX IF NOT EXISTS idx_personnel_security_cards_expiry_date ON personnel_security_cards(expiry_date);
CREATE INDEX IF NOT EXISTS idx_personnel_security_cards_is_active ON personnel_security_cards(is_active);

-- ==============================================
-- RLS POLİTİKALARI
-- ==============================================

-- RLS'yi etkinleştir
ALTER TABLE personnel_security_cards ENABLE ROW LEVEL SECURITY;

-- Tenant bazlı erişim politikası
CREATE POLICY "personnel_security_cards_tenant_policy" ON personnel_security_cards
  FOR ALL USING (
    tenant_id::text = (auth.jwt() ->> 'tenant_id')
  );

-- ==============================================
-- TRİGGER (updated_at otomatik güncelleme)
-- ==============================================

CREATE OR REPLACE FUNCTION update_personnel_security_cards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_personnel_security_cards_updated_at
  BEFORE UPDATE ON personnel_security_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_personnel_security_cards_updated_at();

-- ==============================================
-- YARDIMCI FONKSİYONLAR
-- ==============================================

-- Personelin aktif güvenlik kartlarını getir
CREATE OR REPLACE FUNCTION get_personnel_active_security_cards(personnel_uuid UUID)
RETURNS TABLE (
  id UUID,
  id_card_number VARCHAR,
  card_type VARCHAR,
  issue_date DATE,
  expiry_date DATE,
  days_until_expiry INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    psc.id,
    psc.id_card_number,
    psc.card_type,
    psc.issue_date,
    psc.expiry_date,
    CASE 
      WHEN psc.expiry_date IS NOT NULL THEN 
        EXTRACT(DAYS FROM (psc.expiry_date - CURRENT_DATE))::INTEGER
      ELSE NULL
    END as days_until_expiry
  FROM personnel_security_cards psc
  WHERE psc.personnel_id = personnel_uuid 
    AND psc.is_active = TRUE
  ORDER BY psc.expiry_date ASC;
END;
$$ LANGUAGE plpgsql;

-- Süresi dolmuş kartları kontrol et
CREATE OR REPLACE FUNCTION check_expired_security_cards()
RETURNS TABLE (
  personnel_id UUID,
  personnel_name TEXT,
  card_number VARCHAR,
  expiry_date DATE,
  days_overdue INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as personnel_id,
    CONCAT(p.first_name, ' ', p.last_name) as personnel_name,
    psc.id_card_number,
    psc.expiry_date,
    EXTRACT(DAYS FROM (CURRENT_DATE - psc.expiry_date))::INTEGER as days_overdue
  FROM personnel_security_cards psc
  JOIN personnel p ON psc.personnel_id = p.id
  WHERE psc.is_active = TRUE 
    AND psc.expiry_date < CURRENT_DATE
  ORDER BY psc.expiry_date ASC;
END;
$$ LANGUAGE plpgsql;
