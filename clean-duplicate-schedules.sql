-- Duplicate schedule'ları temizle

-- Önce mevcut durumu kontrol et
SELECT id, year, month, tenant_id, created_at 
FROM duty_schedules 
WHERE tenant_id = '95ba933f-6647-4181-bf57-e50119b13050' 
AND year = 2025 
AND month = 9
ORDER BY created_at;

-- En eski schedule'ları sil (en yenisini koru)
WITH ranked_schedules AS (
  SELECT id, 
         ROW_NUMBER() OVER (ORDER BY created_at DESC) as rn
  FROM duty_schedules 
  WHERE tenant_id = '95ba933f-6647-4181-bf57-e50119b13050' 
  AND year = 2025 
  AND month = 9
)
DELETE FROM duty_schedules 
WHERE id IN (
  SELECT id FROM ranked_schedules WHERE rn > 1
);

-- Sonucu kontrol et
SELECT id, year, month, tenant_id, created_at 
FROM duty_schedules 
WHERE tenant_id = '95ba933f-6647-4181-bf57-e50119b13050' 
AND year = 2025 
AND month = 9;

