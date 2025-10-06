-- Add leave types (izinli-muaf günler) to shift_types table
-- Run this in Supabase SQL Editor

-- First, let's see what tenants and projects exist
SELECT 'Existing tenants:' as info;
SELECT id, name, subdomain FROM public.tenants ORDER BY created_at;

SELECT 'Existing projects:' as info;
SELECT id, name, tenant_id FROM public.projects ORDER BY created_at;

-- ÜCRETSİZ (Unpaid) Leave Types
-- MAZERET İZNİ (MI) - Turuncu
INSERT INTO public.shift_types (tenant_id, project_id, name, code, start_time, end_time, duration, break_duration, is_night_shift, is_weekend_shift, color, description, is_active, created_by)
SELECT 
    p.tenant_id,
    p.id as project_id,
    'Mazeret İzni' as name,
    'MI' as code,
    '00:00:00'::time as start_time,
    '00:00:00'::time as end_time,
    0 as duration,
    0 as break_duration,
    FALSE as is_night_shift,
    FALSE as is_weekend_shift,
    '#FF9800' as color,
    'Ücretsiz mazeret izni' as description,
    TRUE as is_active,
    (SELECT id FROM auth.users LIMIT 1) as created_by
FROM public.projects p
WHERE NOT EXISTS (
    SELECT 1 FROM public.shift_types st 
    WHERE st.tenant_id = p.tenant_id 
    AND st.project_id = p.id 
    AND st.code = 'MI'
);

-- ÜCRETSİZ İZİN (Öİ) - Açık turuncu
INSERT INTO public.shift_types (tenant_id, project_id, name, code, start_time, end_time, duration, break_duration, is_night_shift, is_weekend_shift, color, description, is_active, created_by)
SELECT 
    p.tenant_id,
    p.id as project_id,
    'Ücretsiz İzin' as name,
    'Öİ' as code,
    '00:00:00'::time as start_time,
    '00:00:00'::time as end_time,
    0 as duration,
    0 as break_duration,
    FALSE as is_night_shift,
    FALSE as is_weekend_shift,
    '#FFB74D' as color,
    'Ücretsiz izin' as description,
    TRUE as is_active,
    (SELECT id FROM auth.users LIMIT 1) as created_by
FROM public.projects p
WHERE NOT EXISTS (
    SELECT 1 FROM public.shift_types st 
    WHERE st.tenant_id = p.tenant_id 
    AND st.project_id = p.id 
    AND st.code = 'Öİ'
);

-- MAZER. GELMEME (MG) - Sarı
INSERT INTO public.shift_types (tenant_id, project_id, name, code, start_time, end_time, duration, break_duration, is_night_shift, is_weekend_shift, color, description, is_active, created_by)
SELECT 
    p.tenant_id,
    p.id as project_id,
    'Mazeretsiz Gelmemezlik' as name,
    'MG' as code,
    '00:00:00'::time as start_time,
    '00:00:00'::time as end_time,
    0 as duration,
    0 as break_duration,
    FALSE as is_night_shift,
    FALSE as is_weekend_shift,
    '#FFEB3B' as color,
    'Mazeretsiz gelmemezlik' as description,
    TRUE as is_active,
    (SELECT id FROM auth.users LIMIT 1) as created_by
FROM public.projects p
WHERE NOT EXISTS (
    SELECT 1 FROM public.shift_types st 
    WHERE st.tenant_id = p.tenant_id 
    AND st.project_id = p.id 
    AND st.code = 'MG'
);

-- DOKTOR RAPORU (DR) - Açık turuncu
INSERT INTO public.shift_types (tenant_id, project_id, name, code, start_time, end_time, duration, break_duration, is_night_shift, is_weekend_shift, color, description, is_active, created_by)
SELECT 
    p.tenant_id,
    p.id as project_id,
    'Doktor Raporu' as name,
    'DR' as code,
    '00:00:00'::time as start_time,
    '00:00:00'::time as end_time,
    0 as duration,
    0 as break_duration,
    FALSE as is_night_shift,
    FALSE as is_weekend_shift,
    '#FFB74D' as color,
    'Doktor raporu ile izin' as description,
    TRUE as is_active,
    (SELECT id FROM auth.users LIMIT 1) as created_by
FROM public.projects p
WHERE NOT EXISTS (
    SELECT 1 FROM public.shift_types st 
    WHERE st.tenant_id = p.tenant_id 
    AND st.project_id = p.id 
    AND st.code = 'DR'
);

-- ÜCRETLİ (Paid) Leave Types
-- YILLIK İZİN (Yİ) - Yeşil
INSERT INTO public.shift_types (tenant_id, project_id, name, code, start_time, end_time, duration, break_duration, is_night_shift, is_weekend_shift, color, description, is_active, created_by)
SELECT 
    p.tenant_id,
    p.id as project_id,
    'Yıllık İzin' as name,
    'Yİ' as code,
    '00:00:00'::time as start_time,
    '00:00:00'::time as end_time,
    0 as duration,
    0 as break_duration,
    FALSE as is_night_shift,
    FALSE as is_weekend_shift,
    '#4CAF50' as color,
    'Ücretli yıllık izin' as description,
    TRUE as is_active,
    (SELECT id FROM auth.users LIMIT 1) as created_by
FROM public.projects p
WHERE NOT EXISTS (
    SELECT 1 FROM public.shift_types st 
    WHERE st.tenant_id = p.tenant_id 
    AND st.project_id = p.id 
    AND st.code = 'Yİ'
);

-- EVLİLİK İZNİ (Eİ) - Pembe
INSERT INTO public.shift_types (tenant_id, project_id, name, code, start_time, end_time, duration, break_duration, is_night_shift, is_weekend_shift, color, description, is_active, created_by)
SELECT 
    p.tenant_id,
    p.id as project_id,
    'Evlilik İzni' as name,
    'Eİ' as code,
    '00:00:00'::time as start_time,
    '00:00:00'::time as end_time,
    0 as duration,
    0 as break_duration,
    FALSE as is_night_shift,
    FALSE as is_weekend_shift,
    '#E91E63' as color,
    'Ücretli evlilik izni' as description,
    TRUE as is_active,
    (SELECT id FROM auth.users LIMIT 1) as created_by
FROM public.projects p
WHERE NOT EXISTS (
    SELECT 1 FROM public.shift_types st 
    WHERE st.tenant_id = p.tenant_id 
    AND st.project_id = p.id 
    AND st.code = 'Eİ'
);

-- ÖLÜM İZNİ (Öİ) - Açık turuncu (Note: Same code as ÜCRETSİZ İZİN, but different context)
INSERT INTO public.shift_types (tenant_id, project_id, name, code, start_time, end_time, duration, break_duration, is_night_shift, is_weekend_shift, color, description, is_active, created_by)
SELECT 
    p.tenant_id,
    p.id as project_id,
    'Ölüm İzni' as name,
    'Öİ' as code,
    '00:00:00'::time as start_time,
    '00:00:00'::time as end_time,
    0 as duration,
    0 as break_duration,
    FALSE as is_night_shift,
    FALSE as is_weekend_shift,
    '#FFB74D' as color,
    'Ücretli ölüm izni' as description,
    TRUE as is_active,
    (SELECT id FROM auth.users LIMIT 1) as created_by
FROM public.projects p
WHERE NOT EXISTS (
    SELECT 1 FROM public.shift_types st 
    WHERE st.tenant_id = p.tenant_id 
    AND st.project_id = p.id 
    AND st.code = 'Öİ'
);

-- DOĞUM İZNİ (Dİ) - Açık mavi
INSERT INTO public.shift_types (tenant_id, project_id, name, code, start_time, end_time, duration, break_duration, is_night_shift, is_weekend_shift, color, description, is_active, created_by)
SELECT 
    p.tenant_id,
    p.id as project_id,
    'Doğum İzni' as name,
    'Dİ' as code,
    '00:00:00'::time as start_time,
    '00:00:00'::time as end_time,
    0 as duration,
    0 as break_duration,
    FALSE as is_night_shift,
    FALSE as is_weekend_shift,
    '#81C784' as color,
    'Ücretli doğum izni' as description,
    TRUE as is_active,
    (SELECT id FROM auth.users LIMIT 1) as created_by
FROM public.projects p
WHERE NOT EXISTS (
    SELECT 1 FROM public.shift_types st 
    WHERE st.tenant_id = p.tenant_id 
    AND st.project_id = p.id 
    AND st.code = 'Dİ'
);

-- BAYRAM TATİLİ (BT) - Turuncu
INSERT INTO public.shift_types (tenant_id, project_id, name, code, start_time, end_time, duration, break_duration, is_night_shift, is_weekend_shift, color, description, is_active, created_by)
SELECT 
    p.tenant_id,
    p.id as project_id,
    'Bayram Tatili' as name,
    'BT' as code,
    '00:00:00'::time as start_time,
    '00:00:00'::time as end_time,
    0 as duration,
    0 as break_duration,
    FALSE as is_night_shift,
    FALSE as is_weekend_shift,
    '#FF9800' as color,
    'Resmi bayram tatili' as description,
    TRUE as is_active,
    (SELECT id FROM auth.users LIMIT 1) as created_by
FROM public.projects p
WHERE NOT EXISTS (
    SELECT 1 FROM public.shift_types st 
    WHERE st.tenant_id = p.tenant_id 
    AND st.project_id = p.id 
    AND st.code = 'BT'
);

-- DIŞ GÖREV (DG) - Açık yeşil
INSERT INTO public.shift_types (tenant_id, project_id, name, code, start_time, end_time, duration, break_duration, is_night_shift, is_weekend_shift, color, description, is_active, created_by)
SELECT 
    p.tenant_id,
    p.id as project_id,
    'Dış Görev' as name,
    'DG' as code,
    '00:00:00'::time as start_time,
    '00:00:00'::time as end_time,
    0 as duration,
    0 as break_duration,
    FALSE as is_night_shift,
    FALSE as is_weekend_shift,
    '#A5D6A7' as color,
    'Dış görev' as description,
    TRUE as is_active,
    (SELECT id FROM auth.users LIMIT 1) as created_by
FROM public.projects p
WHERE NOT EXISTS (
    SELECT 1 FROM public.shift_types st 
    WHERE st.tenant_id = p.tenant_id 
    AND st.project_id = p.id 
    AND st.code = 'DG'
);

-- HAFTA TATİLİ (HT) - Koyu gri
INSERT INTO public.shift_types (tenant_id, project_id, name, code, start_time, end_time, duration, break_duration, is_night_shift, is_weekend_shift, color, description, is_active, created_by)
SELECT 
    p.tenant_id,
    p.id as project_id,
    'Hafta Tatili' as name,
    'HT' as code,
    '00:00:00'::time as start_time,
    '00:00:00'::time as end_time,
    0 as duration,
    0 as break_duration,
    FALSE as is_night_shift,
    TRUE as is_weekend_shift,
    '#616161' as color,
    'Hafta sonu tatili' as description,
    TRUE as is_active,
    (SELECT id FROM auth.users LIMIT 1) as created_by
FROM public.projects p
WHERE NOT EXISTS (
    SELECT 1 FROM public.shift_types st 
    WHERE st.tenant_id = p.tenant_id 
    AND st.project_id = p.id 
    AND st.code = 'HT'
);

-- MESAİ (M) - Turuncu
INSERT INTO public.shift_types (tenant_id, project_id, name, code, start_time, end_time, duration, break_duration, is_night_shift, is_weekend_shift, color, description, is_active, created_by)
SELECT 
    p.tenant_id,
    p.id as project_id,
    'Mesai' as name,
    'M' as code,
    '00:00:00'::time as start_time,
    '00:00:00'::time as end_time,
    0 as duration,
    0 as break_duration,
    FALSE as is_night_shift,
    FALSE as is_weekend_shift,
    '#FF9800' as color,
    'Mesai çalışması' as description,
    TRUE as is_active,
    (SELECT id FROM auth.users LIMIT 1) as created_by
FROM public.projects p
WHERE NOT EXISTS (
    SELECT 1 FROM public.shift_types st 
    WHERE st.tenant_id = p.tenant_id 
    AND st.project_id = p.id 
    AND st.code = 'M'
);

-- Verify the data was inserted
SELECT 'Leave types added:' as info;
SELECT COUNT(*) as total_shift_types FROM public.shift_types;

SELECT 'All shift types:' as info;
SELECT tenant_id, project_id, name, code, color, description, is_active FROM public.shift_types ORDER BY created_at;


