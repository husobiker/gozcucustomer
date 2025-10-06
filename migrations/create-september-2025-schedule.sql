-- Eylül 2025 için nöbet çizelgesi oluştur

-- Önce mevcut schedule'ları kontrol et
SELECT id, year, month, tenant_id FROM duty_schedules 
WHERE tenant_id = '95ba933f-6647-4181-bf57-e50119b13050' 
ORDER BY year, month;

-- Eylül 2025 için schedule oluştur (eğer yoksa)
INSERT INTO duty_schedules (
  year,
  month,
  tenant_id,
  created_at,
  updated_at
)
SELECT 
  2025,
  9,
  '95ba933f-6647-4181-bf57-e50119b13050',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM duty_schedules 
  WHERE year = 2025 
  AND month = 9 
  AND tenant_id = '95ba933f-6647-4181-bf57-e50119b13050'
);

-- Sonucu kontrol et
SELECT id, year, month, tenant_id FROM duty_schedules 
WHERE tenant_id = '95ba933f-6647-4181-bf57-e50119b13050' 
AND year = 2025 
AND month = 9;

