-- =========================================================================
-- MEDESCORT INTERNATIONAL - CLEAN SCHEMA & EMPLOYEE FOLDER ACCESS PERMISSIONS
-- 1. EMPLOYEES: 'id' (UUID) AS THE ONLY PRIMARY IDENTIFIER (DROPS 'uuid')
-- 2. HORIZONTAL PERMISSIONS: ONE ROW PER EMPLOYEE KEYED BY 'employee_id'
-- =========================================================================
-- Run this in your Supabase SQL Editor.

-- Ensure cryptographic UUID extensions are enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================================
-- STEP 1: KEEP ONLY 'id' (UUID) ON EMPLOYEES (DROP REDUNDANT 'uuid')
-- =========================================================================

-- 1. Ensure 'id' column exists and is populated with UUID
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();
UPDATE public.employees SET id = gen_random_uuid() WHERE id IS NULL;

-- 2. Dynamically find and drop any existing Primary Key, then set 'id' as Primary Key
DO $$
DECLARE
    pk_record RECORD;
BEGIN
    -- Drop redundant 'uuid' column if it exists
    BEGIN
        ALTER TABLE public.employees DROP COLUMN IF EXISTS uuid CASCADE;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    -- Dynamically drop any existing primary key constraint on public.employees
    FOR pk_record IN (
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'public.employees'::regclass 
          AND contype = 'p'
    ) LOOP
        EXECUTE 'ALTER TABLE public.employees DROP CONSTRAINT IF EXISTS ' || quote_ident(pk_record.conname) || ' CASCADE';
    END LOOP;

    -- Set 'id' (UUID) as the PRIMARY KEY
    ALTER TABLE public.employees ADD PRIMARY KEY (id);

    -- Ensure iqama_number remains UNIQUE for fast lookups
    BEGIN
        ALTER TABLE public.employees DROP CONSTRAINT IF EXISTS employees_iqama_number_key CASCADE;
        ALTER TABLE public.employees ADD CONSTRAINT employees_iqama_number_key UNIQUE (iqama_number);
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
END $$;

-- 3. Performance Indexes (<1ms lookups)
CREATE INDEX IF NOT EXISTS idx_employees_id ON public.employees(id);
CREATE INDEX IF NOT EXISTS idx_employees_iqama ON public.employees(iqama_number);

-- 6. Ensure Row Level Security is active
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated and anon" ON public.employees;
CREATE POLICY "Allow all for authenticated and anon"
ON public.employees
FOR ALL
TO authenticated, anon
USING (true)
WITH CHECK (true);

-- =========================================================================
-- STEP 2: HORIZONTAL PERMISSIONS TABLE (ONE ROW PER EMPLOYEE KEYED BY id)
-- =========================================================================
DROP TABLE IF EXISTS public.employee_folder_permissions CASCADE;

CREATE TABLE public.employee_folder_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID UNIQUE NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    employee_iqama TEXT REFERENCES public.employees(iqama_number) ON DELETE CASCADE,
    
    -- Horizontal Access Columns: 'full' | 'view_only' | 'disabled'
    customers TEXT DEFAULT 'full',          -- Customer Management
    escorts TEXT DEFAULT 'full',            -- Escort Missions
    general_services TEXT DEFAULT 'full',   -- General Services
    invoices TEXT DEFAULT 'full',           -- Invoice & Billing
    vault TEXT DEFAULT 'full',              -- Document Vault
    reports TEXT DEFAULT 'full',            -- Cloud Admin Reports & Analytics
    forms TEXT DEFAULT 'full',              -- Document Hub/forms

    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Performance Indexes (<1ms lookups)
CREATE INDEX IF NOT EXISTS idx_emp_folder_perms_employee_id ON public.employee_folder_permissions(employee_id);
CREATE INDEX IF NOT EXISTS idx_emp_folder_perms_iqama ON public.employee_folder_permissions(employee_iqama);

-- Column documentation for Supabase Dashboard
COMMENT ON TABLE public.employee_folder_permissions IS 'Horizontal employee folder permissions: one clean row per employee keyed by employee_id';
COMMENT ON COLUMN public.employee_folder_permissions.employee_id IS 'Foreign key linking to employees.id';
COMMENT ON COLUMN public.employee_folder_permissions.employee_iqama IS 'Foreign key linking to employees.iqama_number';
COMMENT ON COLUMN public.employee_folder_permissions.customers IS 'Customer Management: full, view_only, or disabled';
COMMENT ON COLUMN public.employee_folder_permissions.escorts IS 'Escort Missions: full, view_only, or disabled';
COMMENT ON COLUMN public.employee_folder_permissions.general_services IS 'General Services: full, view_only, or disabled';
COMMENT ON COLUMN public.employee_folder_permissions.invoices IS 'Invoice & Billing: full, view_only, or disabled';
COMMENT ON COLUMN public.employee_folder_permissions.vault IS 'Document Vault: full, view_only, or disabled';
COMMENT ON COLUMN public.employee_folder_permissions.reports IS 'Cloud Admin Reports & Analytics: full, view_only, or disabled';
COMMENT ON COLUMN public.employee_folder_permissions.forms IS 'Document Hub/forms: full, view_only, or disabled';

-- Row Level Security (RLS)
ALTER TABLE public.employee_folder_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read and write on employee_folder_permissions"
ON public.employee_folder_permissions
FOR ALL
TO authenticated, anon
USING (true)
WITH CHECK (true);

-- Seed initial horizontal permission rows for all existing employees using id
INSERT INTO public.employee_folder_permissions (
    employee_id,
    employee_iqama,
    customers,
    escorts,
    general_services,
    invoices,
    vault,
    reports,
    forms
)
SELECT 
    id,
    iqama_number,
    'full', 'full', 'full', 'full', 'full', 'full', 'full'
FROM public.employees
ON CONFLICT (employee_id) DO NOTHING;

-- Enable Supabase Realtime publication for real-time WebSocket listeners
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.employees;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.employee_folder_permissions;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

