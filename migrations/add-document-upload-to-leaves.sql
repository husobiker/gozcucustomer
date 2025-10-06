-- İzin türlerine belge yükleme özelliği ekle

-- 1. leave_types tablosuna belge gereksinimi ekle (opsiyonel)
ALTER TABLE leave_types 
ADD COLUMN IF NOT EXISTS requires_document BOOLEAN DEFAULT false;

-- 2. personnel_leaves tablosuna belge bilgileri ekle
ALTER TABLE personnel_leaves 
ADD COLUMN IF NOT EXISTS document_url TEXT,
ADD COLUMN IF NOT EXISTS document_name TEXT,
ADD COLUMN IF NOT EXISTS document_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS document_size INTEGER;

-- 3. Belge gerektiren izin türlerini güncelle (opsiyonel - sadece öneri)
UPDATE leave_types 
SET requires_document = true 
WHERE code IN ('DR', 'HI', 'DI', 'BI') 
AND tenant_id = '95ba933f-6647-4181-bf57-e50119b13050';

-- 4. Kontrol et
SELECT code, name, requires_document 
FROM leave_types 
WHERE tenant_id = '95ba933f-6647-4181-bf57-e50119b13050' 
ORDER BY name;
