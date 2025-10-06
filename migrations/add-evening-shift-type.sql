-- Add Evening Shift Type to shift_types table
-- Run this in Supabase SQL Editor

-- Insert Akşam Vardiyası (Evening Shift) for all tenants and projects
INSERT INTO public.shift_types (
    tenant_id, 
    project_id, 
    name, 
    code, 
    start_time, 
    end_time, 
    duration, 
    break_duration, 
    is_night_shift, 
    is_weekend_shift, 
    color, 
    description, 
    is_active, 
    is_leave_type, 
    is_paid_leave, 
    category
) 
SELECT 
    t.id as tenant_id,
    p.id as project_id,
    'Akşam Vardiyası' as name,
    '3' as code,
    '16:00' as start_time,
    '00:00' as end_time,
    8 as duration, -- 8 saat (16:00-00:00)
    0 as break_duration,
    FALSE as is_night_shift, -- Akşam vardiyası gece değil
    FALSE as is_weekend_shift,
    '#FF9800' as color, -- Turuncu renk
    '16:00-00:00 Akşam Vardiyası' as description,
    TRUE as is_active,
    FALSE as is_leave_type,
    FALSE as is_paid_leave,
    'work' as category
FROM public.tenants t
CROSS JOIN public.projects p
WHERE p.name ILIKE '%personelli%' -- Sadece personelli projeler için
ON CONFLICT (tenant_id, project_id, code) DO NOTHING; -- Çakışma durumunda hiçbir şey yapma

-- Sonucu kontrol et
SELECT 
    st.name,
    st.code,
    st.start_time,
    st.end_time,
    st.duration,
    st.color,
    st.description,
    t.name as tenant_name,
    p.name as project_name
FROM public.shift_types st
JOIN public.tenants t ON st.tenant_id = t.id
JOIN public.projects p ON st.project_id = p.id
WHERE st.code = '3'
ORDER BY t.name, p.name;
