-- Create shift_assignments table for multiple personnel per shift
-- Run this in Supabase SQL Editor

-- Create shift_assignments table
CREATE TABLE IF NOT EXISTS public.shift_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    personnel_id UUID NOT NULL REFERENCES public.personnel(id) ON DELETE CASCADE,
    shift_type_id UUID NOT NULL REFERENCES public.shift_types(id) ON DELETE CASCADE,
    assignment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_primary_assignee BOOLEAN DEFAULT FALSE, -- Ana sorumlu personel
    is_backup_assignee BOOLEAN DEFAULT FALSE, -- Yedek personel
    handover_notes TEXT, -- Teslim notları
    status VARCHAR(20) DEFAULT 'assigned', -- assigned, completed, cancelled, no_show
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id),
    updated_by UUID REFERENCES public.users(id),
    
    -- Unique constraint: same personnel can't be assigned to same shift type on same date
    UNIQUE(tenant_id, project_id, personnel_id, shift_type_id, assignment_date)
);

-- Enable Row Level Security
ALTER TABLE public.shift_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view shift assignments for their tenant and project" ON public.shift_assignments
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM public.project_users 
            WHERE user_id = auth.uid() AND project_id = shift_assignments.project_id
        )
    );

CREATE POLICY "Users can insert shift assignments for their tenant and project" ON public.shift_assignments
    FOR INSERT WITH CHECK (
        tenant_id IN (
            SELECT tenant_id FROM public.project_users 
            WHERE user_id = auth.uid() AND project_id = shift_assignments.project_id
        )
    );

CREATE POLICY "Users can update shift assignments for their tenant and project" ON public.shift_assignments
    FOR UPDATE USING (
        tenant_id IN (
            SELECT tenant_id FROM public.project_users 
            WHERE user_id = auth.uid() AND project_id = shift_assignments.project_id
        )
    );

CREATE POLICY "Users can delete shift assignments for their tenant and project" ON public.shift_assignments
    FOR DELETE USING (
        tenant_id IN (
            SELECT tenant_id FROM public.project_users 
            WHERE user_id = auth.uid() AND project_id = shift_assignments.project_id
        )
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_shift_assignments_date ON public.shift_assignments(assignment_date);
CREATE INDEX IF NOT EXISTS idx_shift_assignments_personnel ON public.shift_assignments(personnel_id);
CREATE INDEX IF NOT EXISTS idx_shift_assignments_shift_type ON public.shift_assignments(shift_type_id);
CREATE INDEX IF NOT EXISTS idx_shift_assignments_project ON public.shift_assignments(project_id);

-- Verify table creation
SELECT 'Shift assignments table created successfully!' as info;
SELECT COUNT(*) as table_exists FROM information_schema.tables 
WHERE table_name = 'shift_assignments' AND table_schema = 'public';


