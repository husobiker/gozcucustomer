-- Personnel tablosuna yeni kolonlar ekle
-- Bu script mevcut personnel tablosuna yeni alanları ekler

-- Kişisel bilgiler için kolonlar
ALTER TABLE public.personnel 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS id_number TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('Erkek', 'Kadın')),
ADD COLUMN IF NOT EXISTS hire_date DATE,
ADD COLUMN IF NOT EXISTS position TEXT,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS salary DECIMAL(10,2);

-- İletişim bilgileri için kolonlar
ALTER TABLE public.personnel 
ADD COLUMN IF NOT EXISTS emergency_contact TEXT,
ADD COLUMN IF NOT EXISTS emergency_phone TEXT,
ADD COLUMN IF NOT EXISTS blood_type TEXT,
ADD COLUMN IF NOT EXISTS medical_notes TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Aile bilgisi tablosu oluştur
CREATE TABLE IF NOT EXISTS public.personnel_family (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  personnel_id UUID NOT NULL REFERENCES public.personnel(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Özel güvenlik kart bilgileri tablosu oluştur
CREATE TABLE IF NOT EXISTS public.personnel_security_cards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  personnel_id UUID NOT NULL REFERENCES public.personnel(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  id_card_number TEXT NOT NULL,
  card_type TEXT NOT NULL CHECK (card_type IN ('SİLAHLI', 'SİLAHSIZ')),
  issue_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(personnel_id) -- Her personel için sadece bir kart
);

-- Zimmet tablosu oluştur
CREATE TABLE IF NOT EXISTS public.personnel_inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  personnel_id UUID NOT NULL REFERENCES public.personnel(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  delivery_date DATE NOT NULL,
  return_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'returned')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS politikaları ekle
ALTER TABLE public.personnel_family ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personnel_security_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personnel_inventory ENABLE ROW LEVEL SECURITY;

-- Aile bilgisi için RLS politikaları
CREATE POLICY "personnel_family_tenant_isolation" ON public.personnel_family
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM auth.users WHERE id = auth.uid()));

-- Özel güvenlik kartları için RLS politikaları
CREATE POLICY "personnel_security_cards_tenant_isolation" ON public.personnel_security_cards
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM auth.users WHERE id = auth.uid()));

-- Zimmet için RLS politikaları
CREATE POLICY "personnel_inventory_tenant_isolation" ON public.personnel_inventory
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM auth.users WHERE id = auth.uid()));

-- Index'ler ekle
CREATE INDEX IF NOT EXISTS idx_personnel_family_personnel_id ON public.personnel_family(personnel_id);
CREATE INDEX IF NOT EXISTS idx_personnel_family_tenant_id ON public.personnel_family(tenant_id);
CREATE INDEX IF NOT EXISTS idx_personnel_security_cards_personnel_id ON public.personnel_security_cards(personnel_id);
CREATE INDEX IF NOT EXISTS idx_personnel_security_cards_tenant_id ON public.personnel_security_cards(tenant_id);
CREATE INDEX IF NOT EXISTS idx_personnel_inventory_personnel_id ON public.personnel_inventory(personnel_id);
CREATE INDEX IF NOT EXISTS idx_personnel_inventory_tenant_id ON public.personnel_inventory(tenant_id);
CREATE INDEX IF NOT EXISTS idx_personnel_inventory_status ON public.personnel_inventory(status);

-- Trigger'lar ekle (updated_at için)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_personnel_family_updated_at 
  BEFORE UPDATE ON public.personnel_family 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_personnel_security_cards_updated_at 
  BEFORE UPDATE ON public.personnel_security_cards 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_personnel_inventory_updated_at 
  BEFORE UPDATE ON public.personnel_inventory 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Başarı mesajı
SELECT 'Personnel tablosu ve ilgili tablolar başarıyla güncellendi!' as message;
