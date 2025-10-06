-- Şirket ayarlarına GİB bilgileri ekle
-- SafeBase GİB Özel Entegratör Hazırlık

-- Corporate settings tablosuna GİB alanları ekle
ALTER TABLE corporate_settings ADD COLUMN IF NOT EXISTS tax_office VARCHAR(100);
ALTER TABLE corporate_settings ADD COLUMN IF NOT EXISTS tax_office_code VARCHAR(10);
ALTER TABLE corporate_settings ADD COLUMN IF NOT EXISTS tax_identification_number VARCHAR(11);
ALTER TABLE corporate_settings ADD COLUMN IF NOT EXISTS gib_identifier VARCHAR(50);
ALTER TABLE corporate_settings ADD COLUMN IF NOT EXISTS e_invoice_address VARCHAR(255);
ALTER TABLE corporate_settings ADD COLUMN IF NOT EXISTS e_archive_address VARCHAR(255);
ALTER TABLE corporate_settings ADD COLUMN IF NOT EXISTS e_waybill_address VARCHAR(255);
ALTER TABLE corporate_settings ADD COLUMN IF NOT EXISTS e_musteri_address VARCHAR(255);
ALTER TABLE corporate_settings ADD COLUMN IF NOT EXISTS certificate_serial_number VARCHAR(100);
ALTER TABLE corporate_settings ADD COLUMN IF NOT EXISTS certificate_password VARCHAR(255);
ALTER TABLE corporate_settings ADD COLUMN IF NOT EXISTS certificate_file_path VARCHAR(500);
ALTER TABLE corporate_settings ADD COLUMN IF NOT EXISTS is_gib_test_mode BOOLEAN DEFAULT true;
ALTER TABLE corporate_settings ADD COLUMN IF NOT EXISTS gib_test_environment_url VARCHAR(255);
ALTER TABLE corporate_settings ADD COLUMN IF NOT EXISTS gib_production_environment_url VARCHAR(255);
ALTER TABLE corporate_settings ADD COLUMN IF NOT EXISTS gib_username VARCHAR(100);
ALTER TABLE corporate_settings ADD COLUMN IF NOT EXISTS gib_password VARCHAR(255);
ALTER TABLE corporate_settings ADD COLUMN IF NOT EXISTS gib_wsdl_url VARCHAR(255);
ALTER TABLE corporate_settings ADD COLUMN IF NOT EXISTS gib_soap_endpoint VARCHAR(255);

-- Corporate settings tablosuna indeksler ekle
CREATE INDEX IF NOT EXISTS idx_corporate_settings_tax_id ON corporate_settings(tax_identification_number);
CREATE INDEX IF NOT EXISTS idx_corporate_settings_gib_identifier ON corporate_settings(gib_identifier);

-- Corporate settings tablosuna yorumlar ekle
COMMENT ON COLUMN corporate_settings.tax_office IS 'Vergi dairesi adı';
COMMENT ON COLUMN corporate_settings.tax_office_code IS 'Vergi dairesi kodu';
COMMENT ON COLUMN corporate_settings.tax_identification_number IS 'Vergi kimlik numarası (11 haneli)';
COMMENT ON COLUMN corporate_settings.gib_identifier IS 'GİB tanımlayıcı numarası';
COMMENT ON COLUMN corporate_settings.e_invoice_address IS 'E-fatura adresi';
COMMENT ON COLUMN corporate_settings.e_archive_address IS 'E-arşiv fatura adresi';
COMMENT ON COLUMN corporate_settings.e_waybill_address IS 'E-irsaliye adresi';
COMMENT ON COLUMN corporate_settings.e_musteri_address IS 'E-müstahsil makbuzu adresi';
COMMENT ON COLUMN corporate_settings.certificate_serial_number IS 'E-imza sertifika seri numarası';
COMMENT ON COLUMN corporate_settings.certificate_password IS 'E-imza sertifika şifresi';
COMMENT ON COLUMN corporate_settings.certificate_file_path IS 'E-imza sertifika dosya yolu';
COMMENT ON COLUMN corporate_settings.is_gib_test_mode IS 'GİB test modu aktif mi?';
COMMENT ON COLUMN corporate_settings.gib_test_environment_url IS 'GİB test ortamı URL';
COMMENT ON COLUMN corporate_settings.gib_production_environment_url IS 'GİB canlı ortam URL';
COMMENT ON COLUMN corporate_settings.gib_username IS 'GİB kullanıcı adı';
COMMENT ON COLUMN corporate_settings.gib_password IS 'GİB şifresi';
COMMENT ON COLUMN corporate_settings.gib_wsdl_url IS 'GİB WSDL URL';
COMMENT ON COLUMN corporate_settings.gib_soap_endpoint IS 'GİB SOAP endpoint';


