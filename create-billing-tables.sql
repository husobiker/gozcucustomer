-- Faturalandırma tabloları oluşturma

-- Faturalar tablosu
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'TRY',
    status VARCHAR(20) DEFAULT 'pending', -- pending, paid, overdue, cancelled
    due_date DATE NOT NULL,
    paid_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    subscription_plan VARCHAR(20) NOT NULL,
    notes TEXT
);

-- Ödemeler tablosu
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'TRY',
    payment_method VARCHAR(50) NOT NULL, -- credit_card, bank_transfer, cash, etc.
    payment_reference VARCHAR(100),
    status VARCHAR(20) DEFAULT 'completed', -- pending, completed, failed, refunded
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT
);

-- Abonelik geçmişi tablosu
CREATE TABLE IF NOT EXISTS subscription_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    old_plan VARCHAR(20),
    new_plan VARCHAR(20) NOT NULL,
    change_type VARCHAR(20) NOT NULL, -- upgrade, downgrade, renewal, cancellation
    effective_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT
);

-- Fatura kalemleri tablosu
CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description VARCHAR(255) NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS politikaları
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- Super admin için tüm faturaları görme yetkisi
CREATE POLICY "Super admin can view all invoices" ON invoices
    FOR ALL USING (true);

CREATE POLICY "Super admin can view all payments" ON payments
    FOR ALL USING (true);

CREATE POLICY "Super admin can view all subscription history" ON subscription_history
    FOR ALL USING (true);

CREATE POLICY "Super admin can view all invoice items" ON invoice_items
    FOR ALL USING (true);

-- Indexler
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_id ON invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_tenant_id ON subscription_history(tenant_id);

-- Trigger fonksiyonları
CREATE OR REPLACE FUNCTION update_invoice_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger'lar
CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_invoice_updated_at();

-- Fatura numarası oluşturma fonksiyonu
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
    year_part TEXT;
    month_part TEXT;
    sequence_part TEXT;
    invoice_number TEXT;
BEGIN
    year_part := EXTRACT(YEAR FROM NOW())::TEXT;
    month_part := LPAD(EXTRACT(MONTH FROM NOW())::TEXT, 2, '0');
    
    -- Bu ay için sıra numarası
    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 8) AS INTEGER)), 0) + 1
    INTO sequence_part
    FROM invoices
    WHERE invoice_number LIKE year_part || month_part || '%';
    
    sequence_part := LPAD(sequence_part, 4, '0');
    invoice_number := year_part || month_part || sequence_part;
    
    RETURN invoice_number;
END;
$$ LANGUAGE plpgsql;

-- Otomatik fatura oluşturma fonksiyonu
CREATE OR REPLACE FUNCTION create_monthly_invoice(tenant_uuid UUID)
RETURNS UUID AS $$
DECLARE
    tenant_record RECORD;
    invoice_id UUID;
    plan_prices JSONB := '{"basic": 99, "pro": 299, "enterprise": 999}'::JSONB;
    amount DECIMAL(10,2);
    billing_start DATE;
    billing_end DATE;
BEGIN
    -- Tenant bilgilerini al
    SELECT * INTO tenant_record
    FROM tenants
    WHERE id = tenant_uuid;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Tenant bulunamadı: %', tenant_uuid;
    END IF;
    
    -- Fatura tarihlerini hesapla
    billing_start := DATE_TRUNC('month', NOW())::DATE;
    billing_end := (billing_start + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
    
    -- Plan fiyatını al
    amount := (plan_prices->>tenant_record.subscription_plan)::DECIMAL(10,2);
    
    -- Fatura oluştur
    INSERT INTO invoices (
        tenant_id,
        invoice_number,
        amount,
        due_date,
        billing_period_start,
        billing_period_end,
        subscription_plan
    ) VALUES (
        tenant_uuid,
        generate_invoice_number(),
        amount,
        billing_end + INTERVAL '15 days',
        billing_start,
        billing_end,
        tenant_record.subscription_plan
    ) RETURNING id INTO invoice_id;
    
    -- Fatura kalemi ekle
    INSERT INTO invoice_items (
        invoice_id,
        description,
        quantity,
        unit_price,
        total_price
    ) VALUES (
        invoice_id,
        tenant_record.subscription_plan || ' Plan - ' || 
        TO_CHAR(billing_start, 'DD/MM/YYYY') || ' - ' || 
        TO_CHAR(billing_end, 'DD/MM/YYYY'),
        1,
        amount,
        amount
    );
    
    RETURN invoice_id;
END;
$$ LANGUAGE plpgsql;
