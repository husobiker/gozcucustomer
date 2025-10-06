-- Örnek joker personel kayıtları ekle

-- Önce mevcut projeyi bul
SELECT id, name FROM projects 
WHERE tenant_id = '95ba933f-6647-4181-bf57-e50119b13050' 
LIMIT 1;

-- Örnek joker personel ekle (proje ID'sini yukarıdaki sorgudan alın)
INSERT INTO joker_personnel (
  first_name,
  last_name,
  phone,
  id_number,
  company_name,
  tenant_id,
  project_id,
  status
) VALUES
('Ahmet', 'Yılmaz', '0532 123 45 67', '12345678901', 'ABC Güvenlik', '95ba933f-6647-4181-bf57-e50119b13050', 'PROJECT_ID_BURAYA', 'Aktif'),
('Mehmet', 'Kaya', '0533 234 56 78', '12345678902', 'XYZ Güvenlik', '95ba933f-6647-4181-bf57-e50119b13050', 'PROJECT_ID_BURAYA', 'Aktif'),
('Ali', 'Demir', '0534 345 67 89', '12345678903', 'DEF Güvenlik', '95ba933f-6647-4181-bf57-e50119b13050', 'PROJECT_ID_BURAYA', 'Aktif'),
('Fatma', 'Özkan', '0535 456 78 90', '12345678904', 'GHI Güvenlik', '95ba933f-6647-4181-bf57-e50119b13050', 'PROJECT_ID_BURAYA', 'Aktif'),
('Mustafa', 'Çelik', '0536 567 89 01', '12345678905', 'JKL Güvenlik', '95ba933f-6647-4181-bf57-e50119b13050', 'PROJECT_ID_BURAYA', 'Aktif')
ON CONFLICT (id_number) DO NOTHING;

-- Sonucu kontrol et
SELECT 
  first_name,
  last_name,
  phone,
  company_name,
  status
FROM joker_personnel 
WHERE tenant_id = '95ba933f-6647-4181-bf57-e50119b13050'
ORDER BY created_at DESC;

