-- ==============================================
-- PERSONEL BANK HESAPLARI TABLOSU
-- ==============================================

CREATE TABLE IF NOT EXISTS personnel_bank_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  personnel_id UUID NOT NULL REFERENCES personnel(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Banka Hesap Bilgileri
  account_holder_name VARCHAR(255) NOT NULL, -- Ad Soyad
  iban VARCHAR(34) NOT NULL, -- İBAN (Türkiye için 26 karakter)
  bank_name VARCHAR(255) NOT NULL, -- Hangi Banka
  branch_name VARCHAR(255), -- Şube Adı
  branch_code VARCHAR(20), -- Şube Kodu
  
  -- Hesap Türü
  account_type VARCHAR(50) DEFAULT 'salary' CHECK (account_type IN ('salary', 'bonus', 'other')),
  
  -- Durum
  is_primary BOOLEAN DEFAULT FALSE, -- Ana hesap mı?
  is_active BOOLEAN DEFAULT TRUE, -- Aktif mi?
  
  -- Notlar
  notes TEXT,
  
  -- Zaman Damgaları
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Benzersizlik Kısıtı (Bir personelin aynı İBAN'ı birden fazla kez ekleyemez)
  UNIQUE(personnel_id, iban)
);

-- ==============================================
-- İNDEKSLER (Performans İçin)
-- ==============================================

CREATE INDEX IF NOT EXISTS idx_personnel_bank_accounts_personnel_id ON personnel_bank_accounts(personnel_id);
CREATE INDEX IF NOT EXISTS idx_personnel_bank_accounts_tenant_id ON personnel_bank_accounts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_personnel_bank_accounts_iban ON personnel_bank_accounts(iban);
CREATE INDEX IF NOT EXISTS idx_personnel_bank_accounts_bank_name ON personnel_bank_accounts(bank_name);
CREATE INDEX IF NOT EXISTS idx_personnel_bank_accounts_is_primary ON personnel_bank_accounts(is_primary);
CREATE INDEX IF NOT EXISTS idx_personnel_bank_accounts_is_active ON personnel_bank_accounts(is_active);

-- ==============================================
-- RLS POLİTİKALARI
-- ==============================================

-- RLS'yi etkinleştir
ALTER TABLE personnel_bank_accounts ENABLE ROW LEVEL SECURITY;

-- Tenant bazlı erişim politikası
CREATE POLICY "personnel_bank_accounts_tenant_policy" ON personnel_bank_accounts
  FOR ALL USING (
    tenant_id IN (
      SELECT id FROM tenants 
      WHERE id = auth.jwt() ->> 'tenant_id'
    )
  );

-- ==============================================
-- TRİGGER (updated_at otomatik güncelleme)
-- ==============================================

CREATE OR REPLACE FUNCTION update_personnel_bank_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_personnel_bank_accounts_updated_at
  BEFORE UPDATE ON personnel_bank_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_personnel_bank_accounts_updated_at();

-- ==============================================
-- ÖRNEK VERİLER (Test için)
-- ==============================================

-- Örnek banka listesi için view oluştur
CREATE OR REPLACE VIEW bank_list AS
SELECT DISTINCT bank_name FROM personnel_bank_accounts
WHERE bank_name IS NOT NULL
ORDER BY bank_name;

-- Türkiye'deki popüler bankalar için örnek veri
INSERT INTO personnel_bank_accounts (
  personnel_id, 
  tenant_id, 
  account_holder_name, 
  iban, 
  bank_name, 
  branch_name, 
  branch_code,
  account_type,
  is_primary,
  is_active
) VALUES 
-- Bu örnek veriler gerçek personel ID'leri ile değiştirilmeli
-- (SELECT id FROM personnel LIMIT 1), 
-- (SELECT id FROM tenants LIMIT 1),
-- 'Örnek Personel',
-- 'TR1234567890123456789012345',
-- 'Türkiye İş Bankası',
-- 'Merkez Şubesi',
-- '001',
-- 'salary',
-- true,
-- true
ON CONFLICT DO NOTHING;

-- ==============================================
-- YARDIMCI FONKSİYONLAR
-- ==============================================

-- İBAN doğrulama fonksiyonu (Türkiye için)
CREATE OR REPLACE FUNCTION validate_turkish_iban(iban_input VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
  -- Türkiye İBAN'ı 26 karakter olmalı ve TR ile başlamalı
  IF LENGTH(iban_input) = 26 AND iban_input LIKE 'TR%' THEN
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Personelin ana hesabını getir
CREATE OR REPLACE FUNCTION get_personnel_primary_account(personnel_uuid UUID)
RETURNS TABLE (
  id UUID,
  account_holder_name VARCHAR,
  iban VARCHAR,
  bank_name VARCHAR,
  branch_name VARCHAR,
  branch_code VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pba.id,
    pba.account_holder_name,
    pba.iban,
    pba.bank_name,
    pba.branch_name,
    pba.branch_code
  FROM personnel_bank_accounts pba
  WHERE pba.personnel_id = personnel_uuid 
    AND pba.is_primary = TRUE 
    AND pba.is_active = TRUE
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;
