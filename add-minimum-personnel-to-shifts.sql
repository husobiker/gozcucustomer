-- Add minimum personnel count to shift_types table
-- Run this in Supabase SQL Editor

-- Add minimum personnel columns
ALTER TABLE public.shift_types 
ADD COLUMN IF NOT EXISTS min_personnel_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_personnel_count INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_24_hour_coverage BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS requires_handover BOOLEAN DEFAULT TRUE;

-- Update existing shift types with appropriate personnel counts
-- Gündüz vardiyası - 1-2 personel
UPDATE public.shift_types 
SET min_personnel_count = 1, max_personnel_count = 2, is_24_hour_coverage = FALSE, requires_handover = TRUE
WHERE code IN ('GUN', 'day') OR name ILIKE '%gündüz%';

-- Gece vardiyası - 2-3 personel (güvenlik için daha fazla)
UPDATE public.shift_types 
SET min_personnel_count = 2, max_personnel_count = 3, is_24_hour_coverage = FALSE, requires_handover = TRUE
WHERE code IN ('GEC', 'night') OR name ILIKE '%gece%';

-- Hafta sonu vardiyası - 1-2 personel
UPDATE public.shift_types 
SET min_personnel_count = 1, max_personnel_count = 2, is_24_hour_coverage = FALSE, requires_handover = TRUE
WHERE code IN ('HS') OR name ILIKE '%hafta%';

-- İzin türleri - 0 personel (çalışmıyorlar)
UPDATE public.shift_types 
SET min_personnel_count = 0, max_personnel_count = 0, is_24_hour_coverage = FALSE, requires_handover = FALSE
WHERE is_leave_type = TRUE;

-- Verify the updates
SELECT 'Updated shift types with personnel counts:' as info;
SELECT name, code, min_personnel_count, max_personnel_count, is_24_hour_coverage, requires_handover
FROM public.shift_types 
ORDER BY is_leave_type ASC, min_personnel_count DESC;


