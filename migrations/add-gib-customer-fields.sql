-- Müşteri tablosuna GİB alanları ekle
-- SafeBase GİB Özel Entegratör Hazırlık

-- Müşteri tablosuna GİB alanları ekle
ALTER TABLE customers ADD COLUMN IF NOT EXISTS tax_identification_number VARCHAR(11);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS gib_identifier VARCHAR(50);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS e_invoice_address VARCHAR(255);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS e_archive_address VARCHAR(255);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS e_waybill_address VARCHAR(255);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS e_musteri_address VARCHAR(255);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS is_e_invoice_enabled BOOLEAN DEFAULT false;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS is_e_archive_enabled BOOLEAN DEFAULT false;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS is_e_waybill_enabled BOOLEAN DEFAULT false;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS is_e_musteri_enabled BOOLEAN DEFAULT false;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS gtip_code VARCHAR(12);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS company_type VARCHAR(50) DEFAULT 'LTD_STI'; -- LTD_STI, ANONIM, KOOPERATIF, etc.

-- Müşteri tablosuna indeksler ekle
CREATE INDEX IF NOT EXISTS idx_customers_tax_id ON customers(tax_identification_number);
CREATE INDEX IF NOT EXISTS idx_customers_gib_identifier ON customers(gib_identifier);
CREATE INDEX IF NOT EXISTS idx_customers_gtip_code ON customers(gtip_code);

-- Müşteri tablosuna yorumlar ekle
COMMENT ON COLUMN customers.tax_identification_number IS 'Vergi kimlik numarası (11 haneli)';
COMMENT ON COLUMN customers.gib_identifier IS 'GİB tanımlayıcı numarası';
COMMENT ON COLUMN customers.e_invoice_address IS 'E-fatura adresi';
COMMENT ON COLUMN customers.e_archive_address IS 'E-arşiv fatura adresi';
COMMENT ON COLUMN customers.e_waybill_address IS 'E-irsaliye adresi';
COMMENT ON COLUMN customers.e_musteri_address IS 'E-müstahsil makbuzu adresi';
COMMENT ON COLUMN customers.is_e_invoice_enabled IS 'E-fatura aktif mi?';
COMMENT ON COLUMN customers.is_e_archive_enabled IS 'E-arşiv fatura aktif mi?';
COMMENT ON COLUMN customers.is_e_waybill_enabled IS 'E-irsaliye aktif mi?';
COMMENT ON COLUMN customers.is_e_musteri_enabled IS 'E-müstahsil makbuzu aktif mi?';
COMMENT ON COLUMN customers.gtip_code IS 'GTIP kodu';
COMMENT ON COLUMN customers.company_type IS 'Şirket türü';


