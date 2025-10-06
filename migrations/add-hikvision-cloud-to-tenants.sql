-- Tenants tablosuna Hikvision Cloud bilgilerini ekleme
ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS hikvision_username VARCHAR(255),
ADD COLUMN IF NOT EXISTS hikvision_access_token TEXT,
ADD COLUMN IF NOT EXISTS hikvision_app_key VARCHAR(255),
ADD COLUMN IF NOT EXISTS hikvision_app_secret VARCHAR(255),
ADD COLUMN IF NOT EXISTS hikvision_token_expires_at TIMESTAMP WITH TIME ZONE;

-- Sütunlara yorum ekleme
COMMENT ON COLUMN public.tenants.hikvision_username IS 'Hikvision Cloud kullanıcı adı';
COMMENT ON COLUMN public.tenants.hikvision_access_token IS 'Hikvision Cloud erişim tokeni';
COMMENT ON COLUMN public.tenants.hikvision_app_key IS 'Hikvision Developer App Key';
COMMENT ON COLUMN public.tenants.hikvision_app_secret IS 'Hikvision Developer App Secret';
COMMENT ON COLUMN public.tenants.hikvision_token_expires_at IS 'Token sona erme tarihi';

-- Index ekleme (performans için)
CREATE INDEX IF NOT EXISTS idx_tenants_hikvision_username ON public.tenants(hikvision_username);
CREATE INDEX IF NOT EXISTS idx_tenants_hikvision_token_expires ON public.tenants(hikvision_token_expires_at);
