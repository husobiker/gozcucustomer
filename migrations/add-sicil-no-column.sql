-- Personel tablosuna sicil_no kolonu ekle
-- Bu dosyayı Supabase SQL Editor'da çalıştırın

-- 1. sicil_no kolonu ekle
ALTER TABLE public.personnel 
ADD COLUMN IF NOT EXISTS sicil_no VARCHAR(20);

-- 2. Test et
SELECT 'sicil_no kolonu eklendi!' as status;
SELECT first_name, last_name, sicil_no FROM personnel 
WHERE project_id = 'e68213b9-aee2-4344-8369-15dc794126e8' 
AND status = 'Aktif'
ORDER BY first_name;
