-- Remove duplicate shift systems for each tenant
-- This script keeps the oldest entry (smallest ID) for each unique tenant_id and system_name combination.
-- Run this in Supabase SQL Editor

-- First, let's see what duplicates exist
SELECT 
    tenant_id,
    system_name,
    COUNT(*) as duplicate_count,
    array_agg(id ORDER BY created_at) as system_ids
FROM shift_systems 
WHERE is_active = true
GROUP BY tenant_id, system_name
HAVING COUNT(*) > 1
ORDER BY tenant_id, system_name;

-- Remove duplicates, keeping the oldest entry (smallest ID)
DELETE FROM public.shift_systems a
USING public.shift_systems b
WHERE a.id > b.id
  AND a.tenant_id = b.tenant_id
  AND a.system_name = b.system_name
  AND a.is_active = true
  AND b.is_active = true;

-- Verify duplicates are removed
SELECT 
    tenant_id,
    system_name,
    COUNT(*) as count
FROM shift_systems 
WHERE is_active = true
GROUP BY tenant_id, system_name
HAVING COUNT(*) > 1;


