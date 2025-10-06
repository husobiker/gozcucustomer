-- Add joker personnel support columns to duty_assignments table
-- Run this in Supabase SQL Editor

-- Add joker_personnel_id column (references joker_personnel table)
ALTER TABLE duty_assignments 
ADD COLUMN IF NOT EXISTS joker_personnel_id UUID REFERENCES joker_personnel(id);

-- Add joker_info column (JSONB to store joker personnel information)
ALTER TABLE duty_assignments 
ADD COLUMN IF NOT EXISTS joker_info JSONB;

-- Add is_joker column (boolean to identify joker assignments)
ALTER TABLE duty_assignments 
ADD COLUMN IF NOT EXISTS is_joker BOOLEAN DEFAULT FALSE;

-- Add comments to document the new columns
COMMENT ON COLUMN duty_assignments.joker_personnel_id IS 'Reference to joker_personnel table for joker assignments';
COMMENT ON COLUMN duty_assignments.joker_info IS 'JSONB field containing joker personnel information (name, phone, id_number, company_name)';
COMMENT ON COLUMN duty_assignments.is_joker IS 'Boolean flag to identify if this assignment is for joker personnel';

-- Create index for the new joker_personnel_id column
CREATE INDEX IF NOT EXISTS idx_duty_assignments_joker_personnel_id ON duty_assignments(joker_personnel_id);

-- Create index for the is_joker column
CREATE INDEX IF NOT EXISTS idx_duty_assignments_is_joker ON duty_assignments(is_joker);

-- Update existing records to have default values
UPDATE duty_assignments 
SET is_joker = FALSE 
WHERE is_joker IS NULL;

