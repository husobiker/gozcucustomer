-- Kameralar tablosunu güncelle - Streaming desteği ile
-- Supabase SQL Editor'da çalıştırın

-- Kamera türleri enum'u oluştur
CREATE TYPE camera_type AS ENUM ('hikvision', 'dahua', 'axis', 'other');

-- Kameralar tablosunu güncelle
ALTER TABLE cameras 
ADD COLUMN IF NOT EXISTS camera_type camera_type DEFAULT 'other',
ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45),
ADD COLUMN IF NOT EXISTS username VARCHAR(100),
ADD COLUMN IF NOT EXISTS password VARCHAR(255),
ADD COLUMN IF NOT EXISTS rtsp_port INTEGER DEFAULT 554,
ADD COLUMN IF NOT EXISTS http_port INTEGER DEFAULT 80,
ADD COLUMN IF NOT EXISTS rtsp_main_path VARCHAR(255),
ADD COLUMN IF NOT EXISTS rtsp_sub_path VARCHAR(255),
ADD COLUMN IF NOT EXISTS mjpeg_path VARCHAR(255),
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS stream_quality VARCHAR(20) DEFAULT 'high', -- high, medium, low
ADD COLUMN IF NOT EXISTS recording_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS motion_detection BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS night_vision BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ptz_enabled BOOLEAN DEFAULT false;

-- rtsp_url sütununu nullable yap (eğer NOT NULL ise)
ALTER TABLE cameras ALTER COLUMN rtsp_url DROP NOT NULL;

-- Kamera türüne göre varsayılan path'leri güncelle
UPDATE cameras 
SET 
  rtsp_main_path = CASE 
    WHEN camera_type = 'hikvision' THEN '/Streaming/Channels/101'
    WHEN camera_type = 'dahua' THEN '/cam/realmonitor?channel=1&subtype=0'
    ELSE '/stream1'
  END,
  rtsp_sub_path = CASE 
    WHEN camera_type = 'hikvision' THEN '/Streaming/Channels/102'
    WHEN camera_type = 'dahua' THEN '/cam/realmonitor?channel=1&subtype=1'
    ELSE '/stream2'
  END,
  mjpeg_path = CASE 
    WHEN camera_type = 'hikvision' THEN '/cgi-bin/mjpg/video.cgi?channel=1&subtype=1'
    WHEN camera_type = 'dahua' THEN '/cgi-bin/mjpg/video.cgi?channel=1&subtype=1'
    ELSE '/mjpg/video.mjpg'
  END
WHERE rtsp_main_path IS NULL;

-- Index'ler ekle
CREATE INDEX IF NOT EXISTS idx_cameras_type ON cameras(camera_type);
CREATE INDEX IF NOT EXISTS idx_cameras_ip ON cameras(ip_address);
CREATE INDEX IF NOT EXISTS idx_cameras_online ON cameras(is_online);
CREATE INDEX IF NOT EXISTS idx_cameras_project ON cameras(project_id);

-- Yorumlar ekle
COMMENT ON COLUMN cameras.camera_type IS 'Kamera türü (hikvision, dahua, axis, other)';
COMMENT ON COLUMN cameras.ip_address IS 'Kamera IP adresi';
COMMENT ON COLUMN cameras.username IS 'Kamera kullanıcı adı';
COMMENT ON COLUMN cameras.password IS 'Kamera şifresi (şifrelenmiş)';
COMMENT ON COLUMN cameras.rtsp_port IS 'RTSP port numarası';
COMMENT ON COLUMN cameras.http_port IS 'HTTP port numarası';
COMMENT ON COLUMN cameras.rtsp_main_path IS 'Ana RTSP stream yolu';
COMMENT ON COLUMN cameras.rtsp_sub_path IS 'Alt RTSP stream yolu';
COMMENT ON COLUMN cameras.mjpeg_path IS 'MJPEG stream yolu';
COMMENT ON COLUMN cameras.is_online IS 'Kamera çevrimiçi mi?';
COMMENT ON COLUMN cameras.last_seen IS 'Son görülme zamanı';
COMMENT ON COLUMN cameras.stream_quality IS 'Stream kalitesi (high, medium, low)';
COMMENT ON COLUMN cameras.recording_enabled IS 'Kayıt aktif mi?';
COMMENT ON COLUMN cameras.motion_detection IS 'Hareket algılama aktif mi?';
COMMENT ON COLUMN cameras.night_vision IS 'Gece görüş aktif mi?';
COMMENT ON COLUMN cameras.ptz_enabled IS 'PTZ kontrolü var mı?';

-- Örnek kamera verileri ekle
INSERT INTO cameras (
  project_id, 
  tenant_id,
  name, 
  camera_type, 
  ip_address, 
  username, 
  password, 
  rtsp_port, 
  http_port,
  rtsp_main_path,
  rtsp_sub_path,
  mjpeg_path,
  stream_quality,
  recording_enabled,
  motion_detection,
  night_vision,
  ptz_enabled,
  is_online,
  rtsp_url
) VALUES 
(
  (SELECT id FROM projects LIMIT 1), -- İlk projeyi al
  (SELECT id FROM tenants LIMIT 1), -- İlk tenant'ı al
  'Pendik Giriş Kamerası',
  'hikvision',
  '192.168.1.100',
  'admin',
  'password123',
  554,
  80,
  '/Streaming/Channels/101',
  '/Streaming/Channels/102',
  '/cgi-bin/mjpg/video.cgi?channel=1&subtype=1',
  'high',
  true,
  true,
  true,
  false,
  false,
  'rtsp://admin:password123@192.168.1.100:554/Streaming/Channels/101'
),
(
  (SELECT id FROM projects LIMIT 1),
  (SELECT id FROM tenants LIMIT 1),
  'Pendik Bahçe Kamerası',
  'dahua',
  '192.168.1.101',
  'admin',
  'password123',
  554,
  80,
  '/cam/realmonitor?channel=1&subtype=0',
  '/cam/realmonitor?channel=1&subtype=1',
  '/cgi-bin/mjpg/video.cgi?channel=1&subtype=1',
  'medium',
  true,
  true,
  true,
  true,
  false,
  'rtsp://admin:password123@192.168.1.101:554/cam/realmonitor?channel=1&subtype=0'
);

-- Kamera durumunu kontrol et
SELECT 
  c.id,
  c.name,
  c.camera_type,
  c.ip_address,
  c.is_online,
  c.last_seen,
  p.name as project_name
FROM cameras c
LEFT JOIN projects p ON c.project_id = p.id
ORDER BY c.created_at DESC;
