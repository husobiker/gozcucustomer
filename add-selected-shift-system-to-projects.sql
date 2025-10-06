-- Add selected_shift_system_id column to projects table
-- Run this in Supabase SQL Editor

-- Add the column
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS selected_shift_system_id UUID REFERENCES public.shift_systems(id) ON DELETE SET NULL;

-- Add comment
COMMENT ON COLUMN public.projects.selected_shift_system_id IS 'Seçili vardiya sistemi ID''si - proje bazında hangi vardiya sisteminin kullanılacağını belirler';

-- Update existing projects to have default shift system if none is selected
-- This will set the first available shift system as default for existing projects
UPDATE public.projects 
SET selected_shift_system_id = (
    SELECT ss.id 
    FROM public.shift_systems ss 
    WHERE ss.tenant_id = projects.tenant_id 
    AND ss.is_default = true 
    LIMIT 1
)
WHERE selected_shift_system_id IS NULL;


