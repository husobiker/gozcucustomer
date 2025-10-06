-- Add permissions column to users table
-- Run this in Supabase SQL Editor

-- Add permissions column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}';

-- Add comment to explain the column
COMMENT ON COLUMN public.users.permissions IS 'User permissions for modules (read, add, update, delete)';
