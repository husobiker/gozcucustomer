-- Muhasebe İşlemleri - Stok Yönetimi Tam Veritabanı Yapısı
-- Supabase SQL Kodu - Tam Çalışır Hale Getirilmiş

-- ==============================================
-- ÖNCE MEVCUT TRIGGER'LARI VE TABLOLARI TEMİZLE
-- ==============================================

-- Trigger'ları sil
DROP TRIGGER IF EXISTS trigger_update_inventory_stock ON inventory_movements;
DROP TRIGGER IF EXISTS trigger_generate_transfer_number ON warehouse_transfers;
DROP TRIGGER IF EXISTS trigger_generate_movement_number ON inventory_movements;
DROP TRIGGER IF EXISTS trigger_generate_count_number ON inventory_counts;

-- RLS Politikalarını sil
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON products_services;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON warehouses;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON inventory_stock;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON warehouse_transfers;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON warehouse_transfer_items;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON inventory_movements;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON inventory_counts;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON inventory_count_items;

-- ==============================================
-- 1. ÜRÜNLER VE HİZMETLER TABLOSU
-- ==============================================

CREATE TABLE IF NOT EXISTS products_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  product_code VARCHAR(100) UNIQUE,
  barcode VARCHAR(100) UNIQUE,
  category VARCHAR(100) NOT NULL DEFAULT 'Genel',
  type VARCHAR(20) NOT NULL DEFAULT 'product' CHECK (type IN ('product', 'service')),
  unit VARCHAR(50) NOT NULL DEFAULT 'Adet',
  description TEXT,
  
  -- Stok Takibi
  stock_tracking BOOLEAN DEFAULT TRUE,
  critical_stock_level DECIMAL(10,2) DEFAULT 0,
  
  -- Fiyat Bilgileri
  purchase_price_excluding_tax DECIMAL(15,2) DEFAULT 0,
  sale_price_excluding_tax DECIMAL(15,2) DEFAULT 0,
  vat_rate DECIMAL(5,2) DEFAULT 20.00,
  purchase_price_including_tax DECIMAL(15,2) DEFAULT 0,
  sale_price_including_tax DECIMAL(15,2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'TRY',
  
  -- GTIP Kodları
  gtip_codes TEXT[],
  
  -- Durum
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
  
  -- Zaman Damgaları
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 2. DEPOLAR TABLOSU
-- ==============================================

CREATE TABLE IF NOT EXISTS warehouses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE,
  address TEXT,
  district VARCHAR(100),
  city VARCHAR(100),
  country VARCHAR(100) DEFAULT 'Türkiye',
  postal_code VARCHAR(20),
  phone VARCHAR(20),
  email VARCHAR(255),
  
  -- Depo Özellikleri
  is_default BOOLEAN DEFAULT FALSE,
  is_abroad BOOLEAN DEFAULT FALSE,
  warehouse_type VARCHAR(50) DEFAULT 'main' CHECK (warehouse_type IN ('main', 'branch', 'virtual', 'customer')),
  
  -- Yetkili Kişi
  responsible_person VARCHAR(255),
  responsible_person_phone VARCHAR(20),
  responsible_person_email VARCHAR(255),
  
  -- Durum
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  
  -- Zaman Damgaları
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 3. STOK DURUMU TABLOSU (Depo-Ürün Bazında)
-- ==============================================

CREATE TABLE IF NOT EXISTS inventory_stock (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products_services(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  
  -- Stok Miktarları
  current_stock DECIMAL(15,2) DEFAULT 0,
  reserved_stock DECIMAL(15,2) DEFAULT 0,
  available_stock DECIMAL(15,2) DEFAULT 0,
  
  -- Minimum/Maksimum Stok Seviyeleri
  min_stock_level DECIMAL(15,2) DEFAULT 0,
  max_stock_level DECIMAL(15,2) DEFAULT 0,
  
  -- Son Güncelleme
  last_stock_update TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Zaman Damgaları
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Benzersizlik Kısıtı
  UNIQUE(product_id, warehouse_id)
);

-- ==============================================
-- 4. DEPOLAR ARASI TRANSFER TABLOSU
-- ==============================================

CREATE TABLE IF NOT EXISTS warehouse_transfers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transfer_number VARCHAR(100) UNIQUE NOT NULL,
  movement_name VARCHAR(255) NOT NULL,
  
  -- Depo Bilgileri
  source_warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
  destination_warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
  
  -- Transfer Detayları
  transfer_type VARCHAR(50) DEFAULT 'internal' CHECK (transfer_type IN ('internal', 'external', 'return', 'adjustment')),
  transfer_reason TEXT,
  
  -- Kişi Bilgileri
  delivering_person VARCHAR(255),
  receiving_person VARCHAR(255),
  
  -- Tarih Bilgileri
  preparation_date DATE NOT NULL,
  planned_shipment_date DATE,
  actual_shipment_date DATE,
  planned_receipt_date DATE,
  actual_receipt_date DATE,
  
  -- Durum
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'prepared', 'shipped', 'received', 'completed', 'cancelled')),
  
  -- Notlar
  notes TEXT,
  
  -- Zaman Damgaları
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 5. TRANSFER KALEMLERİ TABLOSU
-- ==============================================

CREATE TABLE IF NOT EXISTS warehouse_transfer_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transfer_id UUID NOT NULL REFERENCES warehouse_transfers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products_services(id) ON DELETE RESTRICT,
  
  -- Miktar Bilgileri
  requested_quantity DECIMAL(15,2) NOT NULL,
  prepared_quantity DECIMAL(15,2) DEFAULT 0,
  shipped_quantity DECIMAL(15,2) DEFAULT 0,
  received_quantity DECIMAL(15,2) DEFAULT 0,
  
  -- Birim ve Fiyat
  unit VARCHAR(50) NOT NULL,
  unit_cost DECIMAL(15,2) DEFAULT 0,
  total_cost DECIMAL(15,2) DEFAULT 0,
  
  -- Durum
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'prepared', 'shipped', 'received', 'completed', 'cancelled')),
  
  -- Notlar
  notes TEXT,
  
  -- Zaman Damgaları
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 6. STOK HAREKETLERİ TABLOSU (Tüm Stok Değişiklikleri)
-- ==============================================

CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  movement_number VARCHAR(100) UNIQUE NOT NULL,
  
  -- Hareket Tipi
  movement_type VARCHAR(50) NOT NULL CHECK (movement_type IN (
    'purchase', 'sale', 'transfer_in', 'transfer_out', 'adjustment', 
    'return', 'production', 'consumption', 'loss', 'found'
  )),
  
  -- Referans Bilgileri
  reference_type VARCHAR(50), -- 'invoice', 'transfer', 'adjustment', etc.
  reference_id UUID,
  
  -- Ürün ve Depo
  product_id UUID NOT NULL REFERENCES products_services(id) ON DELETE RESTRICT,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
  
  -- Miktar Bilgileri
  quantity_before DECIMAL(15,2) NOT NULL DEFAULT 0,
  movement_quantity DECIMAL(15,2) NOT NULL,
  quantity_after DECIMAL(15,2) NOT NULL DEFAULT 0,
  
  -- Birim ve Fiyat
  unit VARCHAR(50) NOT NULL,
  unit_cost DECIMAL(15,2) DEFAULT 0,
  total_cost DECIMAL(15,2) DEFAULT 0,
  
  -- Hareket Detayları
  movement_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  description TEXT,
  
  -- Zaman Damgaları
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 7. STOK SAYIM TABLOSU
-- ==============================================

CREATE TABLE IF NOT EXISTS inventory_counts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  count_number VARCHAR(100) UNIQUE NOT NULL,
  count_name VARCHAR(255) NOT NULL,
  
  -- Sayım Bilgileri
  count_date DATE NOT NULL,
  warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
  
  -- Durum
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'approved')),
  
  -- Notlar
  notes TEXT,
  
  -- Zaman Damgaları
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 8. STOK SAYIM KALEMLERİ TABLOSU
-- ==============================================

CREATE TABLE IF NOT EXISTS inventory_count_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  count_id UUID NOT NULL REFERENCES inventory_counts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products_services(id) ON DELETE RESTRICT,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
  
  -- Sayım Miktarları
  system_quantity DECIMAL(15,2) NOT NULL DEFAULT 0,
  counted_quantity DECIMAL(15,2) DEFAULT 0,
  difference_quantity DECIMAL(15,2) DEFAULT 0,
  
  -- Birim
  unit VARCHAR(50) NOT NULL,
  
  -- Notlar
  notes TEXT,
  
  -- Zaman Damgaları
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Benzersizlik Kısıtı
  UNIQUE(count_id, product_id, warehouse_id)
);

-- ==============================================
-- İNDEKSLER (Performans İçin)
-- ==============================================

-- Products Services İndeksleri
CREATE INDEX IF NOT EXISTS idx_products_services_name ON products_services(name);
CREATE INDEX IF NOT EXISTS idx_products_services_code ON products_services(product_code);
CREATE INDEX IF NOT EXISTS idx_products_services_barcode ON products_services(barcode);
CREATE INDEX IF NOT EXISTS idx_products_services_category ON products_services(category);
CREATE INDEX IF NOT EXISTS idx_products_services_type ON products_services(type);
CREATE INDEX IF NOT EXISTS idx_products_services_status ON products_services(status);

-- Warehouses İndeksleri
CREATE INDEX IF NOT EXISTS idx_warehouses_name ON warehouses(name);
CREATE INDEX IF NOT EXISTS idx_warehouses_code ON warehouses(code);
CREATE INDEX IF NOT EXISTS idx_warehouses_city ON warehouses(city);
CREATE INDEX IF NOT EXISTS idx_warehouses_is_default ON warehouses(is_default);
CREATE INDEX IF NOT EXISTS idx_warehouses_status ON warehouses(status);

-- Inventory Stock İndeksleri
CREATE INDEX IF NOT EXISTS idx_inventory_stock_product ON inventory_stock(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_stock_warehouse ON inventory_stock(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inventory_stock_current_stock ON inventory_stock(current_stock);
CREATE INDEX IF NOT EXISTS idx_inventory_stock_available_stock ON inventory_stock(available_stock);

-- Warehouse Transfers İndeksleri
CREATE INDEX IF NOT EXISTS idx_warehouse_transfers_number ON warehouse_transfers(transfer_number);
CREATE INDEX IF NOT EXISTS idx_warehouse_transfers_source ON warehouse_transfers(source_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_transfers_destination ON warehouse_transfers(destination_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_transfers_status ON warehouse_transfers(status);
CREATE INDEX IF NOT EXISTS idx_warehouse_transfers_preparation_date ON warehouse_transfers(preparation_date);

-- Warehouse Transfer Items İndeksleri
CREATE INDEX IF NOT EXISTS idx_transfer_items_transfer ON warehouse_transfer_items(transfer_id);
CREATE INDEX IF NOT EXISTS idx_transfer_items_product ON warehouse_transfer_items(product_id);
CREATE INDEX IF NOT EXISTS idx_transfer_items_status ON warehouse_transfer_items(status);

-- Inventory Movements İndeksleri
CREATE INDEX IF NOT EXISTS idx_inventory_movements_number ON inventory_movements(movement_number);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_type ON inventory_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product ON inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_warehouse ON inventory_movements(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_date ON inventory_movements(movement_date);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_reference ON inventory_movements(reference_type, reference_id);

-- Inventory Counts İndeksleri
CREATE INDEX IF NOT EXISTS idx_inventory_counts_number ON inventory_counts(count_number);
CREATE INDEX IF NOT EXISTS idx_inventory_counts_warehouse ON inventory_counts(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inventory_counts_date ON inventory_counts(count_date);
CREATE INDEX IF NOT EXISTS idx_inventory_counts_status ON inventory_counts(status);

-- Inventory Count Items İndeksleri
CREATE INDEX IF NOT EXISTS idx_count_items_count ON inventory_count_items(count_id);
CREATE INDEX IF NOT EXISTS idx_count_items_product ON inventory_count_items(product_id);
CREATE INDEX IF NOT EXISTS idx_count_items_warehouse ON inventory_count_items(warehouse_id);

-- ==============================================
-- TRİGGER FONKSİYONLARI
-- ==============================================

-- Stok Güncelleme Trigger Fonksiyonu
CREATE OR REPLACE FUNCTION update_inventory_stock()
RETURNS TRIGGER AS $$
BEGIN
  -- Mevcut stok miktarını güncelle
  UPDATE inventory_stock 
  SET 
    current_stock = NEW.quantity_after,
    available_stock = NEW.quantity_after - reserved_stock,
    last_stock_update = NOW(),
    updated_at = NOW()
  WHERE product_id = NEW.product_id AND warehouse_id = NEW.warehouse_id;
  
  -- Eğer kayıt yoksa yeni kayıt oluştur
  IF NOT FOUND THEN
    INSERT INTO inventory_stock (product_id, warehouse_id, current_stock, available_stock, last_stock_update)
    VALUES (NEW.product_id, NEW.warehouse_id, NEW.quantity_after, NEW.quantity_after, NOW());
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Stok Hareketi Trigger'ı
CREATE TRIGGER trigger_update_inventory_stock
  AFTER INSERT ON inventory_movements
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_stock();

-- Transfer Numarası Otomatik Oluşturma Fonksiyonu
CREATE OR REPLACE FUNCTION generate_transfer_number()
RETURNS TRIGGER AS $$
DECLARE
  year_part TEXT;
  month_part TEXT;
  sequence_num INTEGER;
  new_number TEXT;
BEGIN
  -- Yıl ve ay bilgisini al
  year_part := EXTRACT(YEAR FROM NEW.created_at)::TEXT;
  month_part := LPAD(EXTRACT(MONTH FROM NEW.created_at)::TEXT, 2, '0');
  
  -- Bu ay için kaç transfer var
  SELECT COALESCE(MAX(CAST(SUBSTRING(transfer_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM warehouse_transfers
  WHERE transfer_number LIKE 'TR' || year_part || month_part || '%';
  
  -- Yeni numara oluştur
  new_number := 'TR' || year_part || month_part || LPAD(sequence_num::TEXT, 4, '0');
  
  NEW.transfer_number := new_number;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Transfer Numarası Trigger'ı
CREATE TRIGGER trigger_generate_transfer_number
  BEFORE INSERT ON warehouse_transfers
  FOR EACH ROW
  WHEN (NEW.transfer_number IS NULL OR NEW.transfer_number = '')
  EXECUTE FUNCTION generate_transfer_number();

-- Hareket Numarası Otomatik Oluşturma Fonksiyonu
CREATE OR REPLACE FUNCTION generate_movement_number()
RETURNS TRIGGER AS $$
DECLARE
  year_part TEXT;
  month_part TEXT;
  sequence_num INTEGER;
  new_number TEXT;
BEGIN
  -- Yıl ve ay bilgisini al
  year_part := EXTRACT(YEAR FROM NEW.created_at)::TEXT;
  month_part := LPAD(EXTRACT(MONTH FROM NEW.created_at)::TEXT, 2, '0');
  
  -- Bu ay için kaç hareket var
  SELECT COALESCE(MAX(CAST(SUBSTRING(movement_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM inventory_movements
  WHERE movement_number LIKE 'MV' || year_part || month_part || '%';
  
  -- Yeni numara oluştur
  new_number := 'MV' || year_part || month_part || LPAD(sequence_num::TEXT, 4, '0');
  
  NEW.movement_number := new_number;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Hareket Numarası Trigger'ı
CREATE TRIGGER trigger_generate_movement_number
  BEFORE INSERT ON inventory_movements
  FOR EACH ROW
  WHEN (NEW.movement_number IS NULL OR NEW.movement_number = '')
  EXECUTE FUNCTION generate_movement_number();

-- Sayım Numarası Otomatik Oluşturma Fonksiyonu
CREATE OR REPLACE FUNCTION generate_count_number()
RETURNS TRIGGER AS $$
DECLARE
  year_part TEXT;
  month_part TEXT;
  sequence_num INTEGER;
  new_number TEXT;
BEGIN
  -- Yıl ve ay bilgisini al
  year_part := EXTRACT(YEAR FROM NEW.created_at)::TEXT;
  month_part := LPAD(EXTRACT(MONTH FROM NEW.created_at)::TEXT, 2, '0');
  
  -- Bu ay için kaç sayım var
  SELECT COALESCE(MAX(CAST(SUBSTRING(count_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM inventory_counts
  WHERE count_number LIKE 'CN' || year_part || month_part || '%';
  
  -- Yeni numara oluştur
  new_number := 'CN' || year_part || month_part || LPAD(sequence_num::TEXT, 4, '0');
  
  NEW.count_number := new_number;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Sayım Numarası Trigger'ı
CREATE TRIGGER trigger_generate_count_number
  BEFORE INSERT ON inventory_counts
  FOR EACH ROW
  WHEN (NEW.count_number IS NULL OR NEW.count_number = '')
  EXECUTE FUNCTION generate_count_number();

-- ==============================================
-- ÖRNEK VERİLER
-- ==============================================

-- Örnek Depolar
INSERT INTO warehouses (name, code, address, district, city, is_default, warehouse_type, responsible_person) VALUES
('Ana Depo (Varsayılan Depo)', 'MAIN', 'Sanayi Mahallesi, Fabrika Sokak No:15', 'Merkez', 'İstanbul', true, 'main', 'Ahmet Yılmaz'),
('Demirbaş', 'DEMIRBAS', 'Ofis Mahallesi, İş Merkezi No:8', 'Kadıköy', 'İstanbul', false, 'branch', 'Mehmet Demir'),
('SEDAT BEY', 'SEDAT', 'Ticaret Mahallesi, İş Yeri Sokak No:22', 'Beşiktaş', 'İstanbul', false, 'branch', 'Sedat Bey')
ON CONFLICT (code) DO NOTHING;

-- Örnek Ürünler
INSERT INTO products_services (name, product_code, category, type, unit, purchase_price_excluding_tax, sale_price_excluding_tax, vat_rate, currency, stock_tracking) VALUES
('100 metre 3x1,5 elektrik kablosu', 'KAB-001', 'Elektrik', 'product', 'Adet', 0, 92, 20, 'TRY', true),
('100 metre 3x2,5 elektrik kablosu', 'KAB-002', 'Elektrik', 'product', 'Adet', 0, 0, 20, 'TRY', true),
('10 AMPER FOTOSEL', 'FOT-001', 'Elektrik', 'product', 'Adet', 85, 0, 20, 'TRY', true),
('10 AMPER ŞERİT LED TRAFOSU(120W)', 'TRA-001', 'Elektrik', 'product', 'Adet', 120, 0, 20, 'TRY', true),
('113X113X210 TERMOPLASTİK BUAT', 'BUA-001', 'Elektrik', 'product', 'Adet', 0, 0, 20, 'TRY', true),
('12W SLIM PANEL(BEYAZ)', 'PAN-001', 'Aydınlatma', 'product', 'Adet', 55, 0, 20, 'TRY', true)
ON CONFLICT (product_code) DO NOTHING;

-- Örnek Stok Durumları
INSERT INTO inventory_stock (product_id, warehouse_id, current_stock, available_stock, min_stock_level) 
SELECT 
  p.id,
  w.id,
  CASE 
    WHEN p.product_code = 'TRA-001' THEN 4
    WHEN p.product_code = 'PAN-001' THEN 40
    ELSE 0
  END,
  CASE 
    WHEN p.product_code = 'TRA-001' THEN 4
    WHEN p.product_code = 'PAN-001' THEN 40
    ELSE 0
  END,
  5
FROM products_services p
CROSS JOIN warehouses w
WHERE w.is_default = true
ON CONFLICT (product_id, warehouse_id) DO NOTHING;

-- ==============================================
-- YARDIMCI FONKSİYONLAR
-- ==============================================

-- Stok Transferi Fonksiyonu
CREATE OR REPLACE FUNCTION transfer_stock(
  p_product_id UUID,
  p_source_warehouse_id UUID,
  p_destination_warehouse_id UUID,
  p_quantity DECIMAL,
  p_transfer_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  current_stock_source DECIMAL;
  current_stock_dest DECIMAL;
BEGIN
  -- Kaynak depodaki mevcut stoku kontrol et
  SELECT current_stock INTO current_stock_source
  FROM inventory_stock
  WHERE product_id = p_product_id AND warehouse_id = p_source_warehouse_id;
  
  IF current_stock_source IS NULL OR current_stock_source < p_quantity THEN
    RAISE EXCEPTION 'Yetersiz stok! Mevcut: %, İstenen: %', COALESCE(current_stock_source, 0), p_quantity;
  END IF;
  
  -- Hedef depodaki mevcut stoku al
  SELECT current_stock INTO current_stock_dest
  FROM inventory_stock
  WHERE product_id = p_product_id AND warehouse_id = p_destination_warehouse_id;
  
  current_stock_dest := COALESCE(current_stock_dest, 0);
  
  -- Çıkış hareketi kaydet
  INSERT INTO inventory_movements (
    movement_type, reference_type, reference_id, product_id, warehouse_id,
    quantity_before, movement_quantity, quantity_after, unit, description
  ) VALUES (
    'transfer_out', 'transfer', p_transfer_id, p_product_id, p_source_warehouse_id,
    current_stock_source, -p_quantity, current_stock_source - p_quantity, 
    (SELECT unit FROM products_services WHERE id = p_product_id),
    COALESCE(p_description, 'Depo transferi - Çıkış')
  );
  
  -- Giriş hareketi kaydet
  INSERT INTO inventory_movements (
    movement_type, reference_type, reference_id, product_id, warehouse_id,
    quantity_before, movement_quantity, quantity_after, unit, description
  ) VALUES (
    'transfer_in', 'transfer', p_transfer_id, p_product_id, p_destination_warehouse_id,
    current_stock_dest, p_quantity, current_stock_dest + p_quantity,
    (SELECT unit FROM products_services WHERE id = p_product_id),
    COALESCE(p_description, 'Depo transferi - Giriş')
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Stok Düzeltme Fonksiyonu
CREATE OR REPLACE FUNCTION adjust_stock(
  p_product_id UUID,
  p_warehouse_id UUID,
  p_new_quantity DECIMAL,
  p_reason TEXT DEFAULT 'Stok düzeltme'
)
RETURNS BOOLEAN AS $$
DECLARE
  current_stock DECIMAL;
BEGIN
  -- Mevcut stoku al
  SELECT current_stock INTO current_stock
  FROM inventory_stock
  WHERE product_id = p_product_id AND warehouse_id = p_warehouse_id;
  
  current_stock := COALESCE(current_stock, 0);
  
  -- Düzeltme hareketi kaydet
  INSERT INTO inventory_movements (
    movement_type, product_id, warehouse_id,
    quantity_before, movement_quantity, quantity_after, unit, description
  ) VALUES (
    'adjustment', p_product_id, p_warehouse_id,
    current_stock, p_new_quantity - current_stock, p_new_quantity,
    (SELECT unit FROM products_services WHERE id = p_product_id),
    p_reason
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Stok Raporu Fonksiyonu
CREATE OR REPLACE FUNCTION get_stock_report(p_warehouse_id UUID DEFAULT NULL)
RETURNS TABLE (
  product_name VARCHAR,
  product_code VARCHAR,
  warehouse_name VARCHAR,
  current_stock DECIMAL,
  available_stock DECIMAL,
  reserved_stock DECIMAL,
  min_stock_level DECIMAL,
  max_stock_level DECIMAL,
  unit VARCHAR,
  last_update TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ps.name,
    ps.product_code,
    w.name,
    ist.current_stock,
    ist.available_stock,
    ist.reserved_stock,
    ist.min_stock_level,
    ist.max_stock_level,
    ps.unit,
    ist.last_stock_update
  FROM inventory_stock ist
  JOIN products_services ps ON ist.product_id = ps.id
  JOIN warehouses w ON ist.warehouse_id = w.id
  WHERE (p_warehouse_id IS NULL OR ist.warehouse_id = p_warehouse_id)
    AND ps.stock_tracking = true
  ORDER BY ps.name, w.name;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- GÜVENLİK VE İZİNLER
-- ==============================================

-- RLS (Row Level Security) Politikaları
ALTER TABLE products_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_transfer_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_count_items ENABLE ROW LEVEL SECURITY;

-- Temel politikalar (authenticated kullanıcılar için)
CREATE POLICY "Enable read access for authenticated users" ON products_services
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON warehouses
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON inventory_stock
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON warehouse_transfers
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON warehouse_transfer_items
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON inventory_movements
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON inventory_counts
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON inventory_count_items
  FOR SELECT USING (auth.role() = 'authenticated');

-- ==============================================
-- VERİTABANI KURULUMU TAMAMLANDI
-- ==============================================

-- Bu SQL dosyası şunları içerir:
-- 1. ✅ Ürünler ve Hizmetler tablosu (products_services)
-- 2. ✅ Depolar tablosu (warehouses)  
-- 3. ✅ Stok durumu tablosu (inventory_stock)
-- 4. ✅ Depolar arası transfer tablosu (warehouse_transfers)
-- 5. ✅ Transfer kalemleri tablosu (warehouse_transfer_items)
-- 6. ✅ Stok hareketleri tablosu (inventory_movements)
-- 7. ✅ Stok sayım tablosu (inventory_counts)
-- 8. ✅ Stok sayım kalemleri tablosu (inventory_count_items)
-- 9. ✅ Performans indeksleri
-- 10. ✅ Otomatik numara oluşturma trigger'ları
-- 11. ✅ Stok güncelleme trigger'ları
-- 12. ✅ Yardımcı fonksiyonlar (transfer_stock, adjust_stock, get_stock_report)
-- 13. ✅ Örnek veriler
-- 14. ✅ Güvenlik politikaları (RLS)

-- Kullanım:
-- 1. Bu dosyayı Supabase SQL Editor'da çalıştırın
-- 2. Frontend uygulamanızda bu tablolara bağlanın
-- 3. Mock data yerine gerçek veritabanı işlemlerini kullanın
