-- Sales module tables for yasansafe admin panel

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  short_name VARCHAR(100),
  category VARCHAR(50) DEFAULT 'KATEGORİSİZ',
  type VARCHAR(20) NOT NULL CHECK (type IN ('Tüzel Kişi', 'Gerçek Kişi')),
  tax_number VARCHAR(20),
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  district VARCHAR(100),
  balance DECIMAL(15,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Pasif')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Authorized persons table
CREATE TABLE IF NOT EXISTS authorized_persons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quotes table
CREATE TABLE IF NOT EXISTS quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  customer VARCHAR(255) NOT NULL,
  customer_description TEXT,
  invoice_status VARCHAR(20) DEFAULT 'not_created' CHECK (invoice_status IN ('not_created', 'created')),
  status VARCHAR(20) DEFAULT 'awaiting_response' CHECK (status IN ('awaiting_response', 'approved', 'rejected')),
  edit_date VARCHAR(100),
  total_amount DECIMAL(15,2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'TRY',
  invoiced_amount DECIMAL(15,2) DEFAULT 0,
  preparation_date TIMESTAMP WITH TIME ZONE,
  due_date TIMESTAMP WITH TIME ZONE,
  terms TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quote items table
CREATE TABLE IF NOT EXISTS quote_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  service VARCHAR(255) NOT NULL,
  quantity DECIMAL(10,2) DEFAULT 1,
  unit VARCHAR(50) DEFAULT 'Adet',
  unit_price DECIMAL(15,2) DEFAULT 0,
  tax VARCHAR(50) DEFAULT 'KDV %20',
  total DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_name VARCHAR(255) NOT NULL,
  invoice_number VARCHAR(100),
  customer_name VARCHAR(255) NOT NULL,
  issue_date DATE,
  due_date DATE,
  remaining_amount DECIMAL(15,2) DEFAULT 0,
  total_amount DECIMAL(15,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'Tahsil Edilecek' CHECK (status IN ('Tahsil Edilecek', 'Tahsil Edildi', 'Gecikmiş', 'Proforma')),
  invoice_type VARCHAR(50) DEFAULT 'Satış Faturası' CHECK (invoice_type IN ('Proforma', 'Satış Faturası', 'e-Arşiv Fatura', 'Ticari e-Fatura', 'E-Fatura', 'E-İrsaliye', 'E-Müstahsil Makbuzu')),
  payment_status VARCHAR(20) DEFAULT '' CHECK (payment_status IN ('E-POSTALANDI', 'ONAYLANDI', 'BEKLEMEDE', '')),
  category VARCHAR(50) DEFAULT 'GENEL',
  label VARCHAR(100),
  is_overdue BOOLEAN DEFAULT FALSE,
  overdue_days INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoice items table
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  service VARCHAR(255) NOT NULL,
  warehouse VARCHAR(255),
  quantity DECIMAL(10,2) DEFAULT 1,
  unit VARCHAR(50) DEFAULT 'Adet',
  unit_price DECIMAL(15,2) DEFAULT 0,
  tax VARCHAR(50) DEFAULT 'KDV %20',
  total DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_tax_number ON customers(tax_number);
CREATE INDEX IF NOT EXISTS idx_customers_company_name ON customers(company_name);

CREATE INDEX IF NOT EXISTS idx_quotes_customer ON quotes(customer);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at);

CREATE INDEX IF NOT EXISTS idx_invoices_customer_name ON invoices(customer_name);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON invoices(issue_date);

-- Insert some sample data
INSERT INTO customers (company_name, short_name, category, type, tax_number, email, phone, address, city, district, balance, status) VALUES
('PASCON (PASCON BASIM AMBALAJ SAN. TİC. A.Ş)', 'PASCON', 'SITE', 'Tüzel Kişi', '7230424463', 'info@pascon.com', '+90 212 555 0123', 'Maslak Mahallesi, Büyükdere Caddesi No:123', 'İstanbul', 'Şişli', 61214.40, 'Aktif'),
('W-ATHLETIC (WATHLETIC FITNESS CLUP SPOR SALONLARI İŞLETMECİLİĞİ VE TİC.LTD.ŞTİ)', 'W-ATHLETIC', 'ŞAHIS', 'Tüzel Kişi', '7881157307', 'info@wathletic.com', '+90 216 555 0456', 'Kadıköy Mahallesi, Moda Caddesi No:456', 'İstanbul', 'Kadıköy', 28200.00, 'Aktif'),
('PATROL AMBALAJ', 'PATROL AMBALAJ', 'SITE', 'Tüzel Kişi', '1234567890', 'info@patrol.com', '+90 212 555 0789', 'Beşiktaş Mahallesi, Barbaros Bulvarı No:789', 'İstanbul', 'Beşiktaş', 22485.60, 'Aktif'),
('Botanik Park Evleri', 'Botanik Park', 'SITE', 'Tüzel Kişi', '9876543210', 'yonetim@botanikpark.com', '+90 216 555 0321', 'Ümraniye Mahallesi, Atatürk Caddesi No:321', 'İstanbul', 'Ümraniye', 17074.41, 'Aktif'),
('Doğatek-tülin yıldız', 'Doğatek', 'ŞAHIS', 'Gerçek Kişi', '12345678901', 'tulin@dogatek.com', '+90 532 555 0654', 'Çankaya Mahallesi, Kızılay Caddesi No:654', 'Ankara', 'Çankaya', 253.34, 'Aktif'),
('KENT PLUS', 'KENT PLUS', 'SITE', 'Tüzel Kişi', '1122334455', 'info@kentplus.com', '+90 212 555 0987', 'Beylikdüzü Mahallesi, Cumhuriyet Caddesi No:987', 'İstanbul', 'Beylikdüzü', 8064.00, 'Aktif');

-- Insert sample quotes
INSERT INTO quotes (name, customer, customer_description, preparation_date, due_date, currency, terms, total_amount, status, edit_date) VALUES
('PARKVERDE KAMERA TEKLİFİ', 'PARKVERDE RESİDENCE', 'KURTKÖY PARKVERDE RESİDENCE SİTE YÖNETİMİ', '2025-01-10', '2025-01-17', 'USD', 'TEKLİF VERİLDİĞİ TARİHTEN İTİBAREN 7 GÜN GEÇERLİDİR.', 13339.20, 'awaiting_response', '10 Ocak 2025'),
('FSM HASTANESİ', 'FATİH SULTAN MEHMET HASTANESİ', 'FATİH SULTAN MEHMET HASTANESİ', '2025-03-07', '2025-03-14', 'USD', 'TEKLİF VERİLDİĞİ TARİHTEN İTİBAREN 7 GÜN GEÇERLİDİR.', 11659.20, 'awaiting_response', '7 Mart 2025'),
('GÖKTÜRK KONUTLARI KAMERA TKLF.', 'GÖKTÜRK KONUTLARI SİTESİ YÖNETCİLİĞİ', 'GÖKTÜRK KONUTLARI SİTESİ YÖNETCİLİĞİ', '2025-05-02', '2025-05-09', 'USD', 'TEKLİF VERİLDİĞİ TARİHTEN İTİBAREN 7 GÜN GEÇERLİDİR.', 5469.30, 'awaiting_response', '2 Mayıs 2025');

-- Insert sample quote items
INSERT INTO quote_items (quote_id, service, quantity, unit, unit_price, tax, total) VALUES
((SELECT id FROM quotes WHERE name = 'PARKVERDE KAMERA TEKLİFİ'), 'DAHUA NVR5464-EI', 2, 'Adet', 598.00, 'KDV %20', 1435.20),
((SELECT id FROM quotes WHERE name = 'FSM HASTANESİ'), 'Medikal Ekipman', 1, 'Adet', 10000.00, 'KDV %20', 12000.00),
((SELECT id FROM quotes WHERE name = 'GÖKTÜRK KONUTLARI KAMERA TKLF.'), 'Kamera Sistemi', 1, 'Adet', 5000.00, 'KDV %20', 6000.00);

-- Insert sample invoices
INSERT INTO invoices (invoice_name, invoice_number, customer_name, issue_date, due_date, remaining_amount, total_amount, status, invoice_type, payment_status, category, label, is_overdue, overdue_days) VALUES
('ZEYNEP APARTMANI', '', 'Zeynep Apartmanı Yönetimi', '2025-03-13', '2025-03-14', 16784.41, 16784.41, 'Gecikmiş', 'Proforma', '', 'SITE', 'Apartman', true, 194),
('OSMANLI SİTESİ', '', 'Osmanlı Sitesi Yönetimi', '2025-03-13', '2025-03-13', 7656.00, 7656.00, 'Gecikmiş', 'Satış Faturası', '', 'SITE', 'Site', true, 195),
('ikas E-Ticaret Sipariş: KS1006998', 'YS12025000000001', 'ikas E-Ticaret', '2025-03-04', NULL, 6300.00, 6300.00, 'Tahsil Edilecek', 'e-Arşiv Fatura', 'E-POSTALANDI', 'E-TİCARET', 'Online', false, 0),
('bariyer + pdks', 'YT02025000000001', 'Güvenlik Sistemleri A.Ş.', '2025-02-20', '2025-02-20', 61214.40, 61214.40, 'Gecikmiş', 'Ticari e-Fatura', 'ONAYLANDI', 'GÜVENLİK', 'Sistem', true, 216),
('kentplus telsiz', 'YS02025000000002', 'Kent Plus Sitesi', '2025-02-20', '2025-02-27', 0, 8500.00, 'Tahsil Edildi', 'e-Arşiv Fatura', 'E-POSTALANDI', 'SITE', 'Telsiz', false, 0),
('FATURASIZ BOTANİK PARK İŞLER', 'FATURASIZ 212', 'Botanik Park Evleri', '2025-01-23', '2025-01-23', 7032.50, 7032.50, 'Gecikmiş', 'Satış Faturası', '', 'SITE', 'Bakım', true, 244);

-- Insert sample authorized persons
-- First, let's get the customer IDs and then insert authorized persons
INSERT INTO authorized_persons (customer_id, name, email, phone, notes) 
SELECT c.id, 'Ahmet Yılmaz', 'ahmet@pascon.com', '+90 532 555 0123', 'Genel Müdür'
FROM customers c 
WHERE c.company_name = 'PASCON (PASCON BASIM AMBALAJ SAN. TİC. A.Ş)';

INSERT INTO authorized_persons (customer_id, name, email, phone, notes) 
SELECT c.id, 'Mehmet Demir', 'mehmet@wathletic.com', '+90 532 555 0456', 'Spor Koordinatörü'
FROM customers c 
WHERE c.company_name = 'W-ATHLETIC (WATHLETIC FITNESS CLUP SPOR SALONLARI İŞLETMECİLİĞİ VE TİC.LTD.ŞTİ)';

INSERT INTO authorized_persons (customer_id, name, email, phone, notes) 
SELECT c.id, 'Ayşe Kaya', 'ayse@patrol.com', '+90 532 555 0789', 'Satış Müdürü'
FROM customers c 
WHERE c.company_name = 'PATROL AMBALAJ';
