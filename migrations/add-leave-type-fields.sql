-- Add leave type fields to shift_types table
-- Run this in Supabase SQL Editor

-- Add new columns to shift_types table
ALTER TABLE public.shift_types 
ADD COLUMN IF NOT EXISTS is_leave_type BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_paid_leave BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS category VARCHAR(20) DEFAULT 'work';

-- Update existing leave types to have correct flags
-- ÜCRETSİZ (Unpaid) Leave Types
UPDATE public.shift_types 
SET is_leave_type = TRUE, is_paid_leave = FALSE, category = 'unpaid_leave'
WHERE code IN ('MI', 'Öİ', 'MG', 'DR');

-- ÜCRETLİ (Paid) Leave Types  
UPDATE public.shift_types 
SET is_leave_type = TRUE, is_paid_leave = TRUE, category = 'paid_leave'
WHERE code IN ('Yİ', 'Eİ', 'Dİ', 'BT', 'DG');

-- Holiday types
UPDATE public.shift_types 
SET is_leave_type = TRUE, is_paid_leave = TRUE, category = 'holiday'
WHERE code IN ('HT', 'M');

-- Verify the updates
SELECT 'Updated shift types:' as info;
SELECT name, code, is_leave_type, is_paid_leave, category, color 
FROM public.shift_types 
ORDER BY is_leave_type DESC, category, name;


