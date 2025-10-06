-- Update checkpoints table to add missing columns
-- Run this in Supabase SQL Editor

-- Add missing columns to checkpoints table
ALTER TABLE public.checkpoints 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS distance_sensitivity INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS mobile_form TEXT;

-- Update the type constraint to include 'QR' and 'NFC' options
ALTER TABLE public.checkpoints 
DROP CONSTRAINT IF EXISTS checkpoints_type_check;

ALTER TABLE public.checkpoints 
ADD CONSTRAINT checkpoints_type_check 
CHECK (type IN ('QR', 'NFC', 'GPS', 'QR Kod'));

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_checkpoints_tenant_id ON public.checkpoints(tenant_id);
CREATE INDEX IF NOT EXISTS idx_checkpoints_project_id ON public.checkpoints(project_id);
CREATE INDEX IF NOT EXISTS idx_checkpoints_project_region ON public.checkpoints(project_region);
CREATE INDEX IF NOT EXISTS idx_checkpoints_created_at ON public.checkpoints(created_at);
