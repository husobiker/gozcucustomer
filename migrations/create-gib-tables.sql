-- GİB Uyumlu Veritabanı Şeması
-- SafeBase GİB Özel Entegratör Hazırlık

-- 1. GİB Fatura Tipleri Tablosu
CREATE TABLE IF NOT EXISTS gib_invoice_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- GİB fatura tiplerini ekle
INSERT INTO gib_invoice_types (code, name, description) VALUES
('E_FATURA', 'E-Fatura', 'Elektronik fatura'),
('E_ARSIV', 'E-Arşiv Fatura', 'Elektronik arşiv fatura'),
('E_IRSALIYE', 'E-İrsaliye', 'Elektronik irsaliye'),
('E_MUSTAHIL', 'E-Müstahsil Makbuzu', 'Elektronik müstahsil makbuzu'),
('PROFORMA', 'Proforma Fatura', 'Proforma fatura'),
('SATIS', 'Satış Faturası', 'Normal satış faturası');

-- 2. GTIP Kodları Tablosu
CREATE TABLE IF NOT EXISTS gtip_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(12) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  category VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Güvenlik hizmetleri için GTIP kodları
INSERT INTO gtip_codes (code, description, category) VALUES
('85258000000', 'Güvenlik kameraları ve sistemleri', 'Güvenlik Ekipmanları'),
('85311000000', 'Elektrikli güvenlik alarm sistemleri', 'Güvenlik Ekipmanları'),
('85318000000', 'Diğer elektrikli güvenlik cihazları', 'Güvenlik Ekipmanları'),
('96039000000', 'Güvenlik hizmetleri', 'Hizmetler'),
('96040000000', 'Temizlik hizmetleri', 'Hizmetler'),
('96090000000', 'Diğer hizmetler', 'Hizmetler');

-- 3. GİB Müşteri Bilgileri Tablosu
CREATE TABLE IF NOT EXISTS gib_customer_info (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  tax_identification_number VARCHAR(11) UNIQUE,
  gib_identifier VARCHAR(50),
  e_invoice_address VARCHAR(255),
  e_archive_address VARCHAR(255),
  e_waybill_address VARCHAR(255),
  e_musteri_address VARCHAR(255),
  is_e_invoice_enabled BOOLEAN DEFAULT false,
  is_e_archive_enabled BOOLEAN DEFAULT false,
  is_e_waybill_enabled BOOLEAN DEFAULT false,
  is_e_musteri_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. GİB Şirket Bilgileri Tablosu
CREATE TABLE IF NOT EXISTS gib_company_info (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  tax_office VARCHAR(100),
  tax_office_code VARCHAR(10),
  tax_identification_number VARCHAR(11),
  gib_identifier VARCHAR(50),
  e_invoice_address VARCHAR(255),
  e_archive_address VARCHAR(255),
  e_waybill_address VARCHAR(255),
  e_musteri_address VARCHAR(255),
  certificate_serial_number VARCHAR(100),
  certificate_password VARCHAR(255),
  certificate_file_path VARCHAR(500),
  is_test_mode BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. GİB Fatura Durumları Tablosu
CREATE TABLE IF NOT EXISTS gib_invoice_statuses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_success BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- GİB fatura durumlarını ekle
INSERT INTO gib_invoice_statuses (code, name, description, is_success) VALUES
('PENDING', 'Beklemede', 'Fatura gönderilmeyi bekliyor', false),
('SENT', 'Gönderildi', 'GİB''e gönderildi', false),
('ACCEPTED', 'Kabul Edildi', 'GİB tarafından kabul edildi', true),
('REJECTED', 'Reddedildi', 'GİB tarafından reddedildi', false),
('CANCELLED', 'İptal Edildi', 'Fatura iptal edildi', false),
('PROCESSING', 'İşleniyor', 'GİB tarafından işleniyor', false);

-- 6. GİB Faturalar Tablosu
CREATE TABLE IF NOT EXISTS gib_invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  gib_invoice_id VARCHAR(100),
  gib_invoice_type_id UUID NOT NULL REFERENCES gib_invoice_types(id),
  gib_status_id UUID NOT NULL REFERENCES gib_invoice_statuses(id),
  ubl_tr_xml TEXT,
  gib_response_xml TEXT,
  e_signature TEXT,
  gib_error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. GİB Fatura Kalemleri Tablosu
CREATE TABLE IF NOT EXISTS gib_invoice_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gib_invoice_id UUID NOT NULL REFERENCES gib_invoices(id) ON DELETE CASCADE,
  gtip_code_id UUID REFERENCES gtip_codes(id),
  item_name VARCHAR(255) NOT NULL,
  item_description TEXT,
  quantity DECIMAL(15,3) NOT NULL DEFAULT 1,
  unit VARCHAR(50) NOT NULL DEFAULT 'Adet',
  unit_price DECIMAL(15,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 20.00,
  tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. GİB API Logları Tablosu
CREATE TABLE IF NOT EXISTS gib_api_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID REFERENCES invoices(id),
  api_endpoint VARCHAR(255) NOT NULL,
  request_xml TEXT,
  response_xml TEXT,
  status_code INTEGER,
  error_message TEXT,
  processing_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. GİB Sertifika Yönetimi Tablosu
CREATE TABLE IF NOT EXISTS gib_certificates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  certificate_name VARCHAR(100) NOT NULL,
  serial_number VARCHAR(100) NOT NULL,
  password VARCHAR(255),
  file_path VARCHAR(500),
  valid_from TIMESTAMP WITH TIME ZONE,
  valid_to TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. GİB Test Verileri Tablosu
CREATE TABLE IF NOT EXISTS gib_test_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  test_type VARCHAR(50) NOT NULL,
  test_name VARCHAR(100) NOT NULL,
  test_data JSONB NOT NULL,
  expected_result TEXT,
  actual_result TEXT,
  is_passed BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_gib_invoices_invoice_id ON gib_invoices(invoice_id);
CREATE INDEX IF NOT EXISTS idx_gib_invoices_gib_invoice_id ON gib_invoices(gib_invoice_id);
CREATE INDEX IF NOT EXISTS idx_gib_invoices_status ON gib_invoices(gib_status_id);
CREATE INDEX IF NOT EXISTS idx_gib_customer_info_customer_id ON gib_customer_info(customer_id);
CREATE INDEX IF NOT EXISTS idx_gib_customer_info_tax_id ON gib_customer_info(tax_identification_number);
CREATE INDEX IF NOT EXISTS idx_gib_company_info_tenant_id ON gib_company_info(tenant_id);
CREATE INDEX IF NOT EXISTS idx_gib_api_logs_invoice_id ON gib_api_logs(invoice_id);
CREATE INDEX IF NOT EXISTS idx_gib_api_logs_created_at ON gib_api_logs(created_at);

-- RLS Politikaları
ALTER TABLE gib_customer_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE gib_company_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE gib_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE gib_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE gib_api_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE gib_certificates ENABLE ROW LEVEL SECURITY;

-- GİB müşteri bilgileri için RLS
CREATE POLICY "Users can view their tenant's gib customer info" ON gib_customer_info
  FOR SELECT USING (
    customer_id IN (
      SELECT id FROM customers WHERE tenant_id = (
        SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
      )
    )
  );

-- GİB şirket bilgileri için RLS
CREATE POLICY "Users can view their tenant's gib company info" ON gib_company_info
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    )
  );

-- GİB faturalar için RLS
CREATE POLICY "Users can view their tenant's gib invoices" ON gib_invoices
  FOR SELECT USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE tenant_id = (
        SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
      )
    )
  );

-- GİB API logları için RLS
CREATE POLICY "Users can view their tenant's gib api logs" ON gib_api_logs
  FOR SELECT USING (
    invoice_id IN (
      SELECT id FROM invoices WHERE tenant_id = (
        SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
      )
    )
  );

-- GİB sertifikalar için RLS
CREATE POLICY "Users can view their tenant's gib certificates" ON gib_certificates
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    )
  );


