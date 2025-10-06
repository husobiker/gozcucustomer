-- Add personnel management fields to projects table
-- Run this in Supabase SQL Editor

-- Add new columns to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS min_personnel_per_shift INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_personnel_per_shift INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS requires_24_hour_coverage BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS shift_handover_required BOOLEAN DEFAULT TRUE;

-- Update existing projects with default values
UPDATE public.projects 
SET 
    min_personnel_per_shift = COALESCE(min_personnel_per_shift, 1),
    max_personnel_per_shift = COALESCE(max_personnel_per_shift, 1),
    requires_24_hour_coverage = COALESCE(requires_24_hour_coverage, FALSE),
    shift_handover_required = COALESCE(shift_handover_required, TRUE)
WHERE min_personnel_per_shift IS NULL 
   OR max_personnel_per_shift IS NULL 
   OR requires_24_hour_coverage IS NULL 
   OR shift_handover_required IS NULL;

-- Verify the updates
SELECT 'Updated projects table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND table_schema = 'public'
AND column_name IN ('min_personnel_per_shift', 'max_personnel_per_shift', 'requires_24_hour_coverage', 'shift_handover_required')
ORDER BY column_name;

-- Show sample data
SELECT 'Sample projects with personnel settings:' as info;
SELECT name, min_personnel_per_shift, max_personnel_per_shift, requires_24_hour_coverage, shift_handover_required
FROM public.projects 
ORDER BY created_at DESC
LIMIT 5;


