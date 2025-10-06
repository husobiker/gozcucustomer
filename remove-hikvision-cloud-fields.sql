-- Hikvision Cloud alanlarını kaldır
-- Supabase SQL Editor'da çalıştırın

-- Hikvision Cloud ile ilgili sütunları kaldır
ALTER TABLE cameras DROP COLUMN IF EXISTS use_hikvision_cloud;
ALTER TABLE cameras DROP COLUMN IF EXISTS hikvision_device_serial;
ALTER TABLE cameras DROP COLUMN IF EXISTS hikvision_channel_no;
ALTER TABLE cameras DROP COLUMN IF EXISTS hikvision_access_token;
ALTER TABLE cameras DROP COLUMN IF EXISTS hikvision_stream_url;

-- Hikvision Cloud ile ilgili index'leri kaldır
DROP INDEX IF EXISTS idx_cameras_hikvision_cloud;
DROP INDEX IF EXISTS idx_cameras_hikvision_device_serial;

-- Kamera türü enum'ını güncelle (sadece hikvision ve dahua)
DROP TYPE IF EXISTS camera_type;
CREATE TYPE camera_type AS ENUM ('hikvision', 'dahua');

-- Kameralar tablosundaki camera_type sütununu güncelle
ALTER TABLE cameras ALTER COLUMN camera_type TYPE camera_type USING camera_type::camera_type;

-- Mevcut kameraları kontrol et
SELECT 
    id,
    name,
    camera_type,
    ip_address,
    status
FROM cameras 
ORDER BY created_at DESC;
