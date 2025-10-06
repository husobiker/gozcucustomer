-- Kamera tablosuna Hikvision Cloud alanları ekle
-- Supabase SQL Editor'da çalıştırın

-- Hikvision Cloud kullanım durumu
ALTER TABLE cameras 
ADD COLUMN IF NOT EXISTS use_hikvision_cloud BOOLEAN DEFAULT false;

-- Hikvision Device Serial (kameranın seri numarası)
ALTER TABLE cameras 
ADD COLUMN IF NOT EXISTS hikvision_device_serial VARCHAR(50);

-- Hikvision Channel Number (kanal numarası)
ALTER TABLE cameras 
ADD COLUMN IF NOT EXISTS hikvision_channel_no INTEGER DEFAULT 1;

-- Hikvision Cloud Access Token (opsiyonel - güvenlik için)
ALTER TABLE cameras 
ADD COLUMN IF NOT EXISTS hikvision_access_token TEXT;

-- Hikvision Cloud Stream URL (cache için)
ALTER TABLE cameras 
ADD COLUMN IF NOT EXISTS hikvision_stream_url TEXT;

-- Index'ler ekle
CREATE INDEX IF NOT EXISTS idx_cameras_hikvision_cloud ON cameras(use_hikvision_cloud);
CREATE INDEX IF NOT EXISTS idx_cameras_hikvision_device_serial ON cameras(hikvision_device_serial);

-- Yorumlar ekle
COMMENT ON COLUMN cameras.use_hikvision_cloud IS 'Hikvision Cloud servisi kullanılıyor mu?';
COMMENT ON COLUMN cameras.hikvision_device_serial IS 'Hikvision kamera seri numarası';
COMMENT ON COLUMN cameras.hikvision_channel_no IS 'Hikvision kamera kanal numarası';
COMMENT ON COLUMN cameras.hikvision_access_token IS 'Hikvision Cloud erişim tokeni';
COMMENT ON COLUMN cameras.hikvision_stream_url IS 'Hikvision Cloud stream URL';

-- Mevcut kameraları kontrol et
SELECT 
    id,
    name,
    ip,
    use_hikvision_cloud,
    hikvision_device_serial,
    hikvision_channel_no
FROM cameras 
ORDER BY created_at DESC;
