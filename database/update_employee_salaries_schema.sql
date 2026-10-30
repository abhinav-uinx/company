-- =========================================================================
-- MEDESCORT INTERNATIONAL - EMPLOYEE SALARIES SCHEMA MIGRATION
-- =========================================================================
-- Run this script in your Supabase Dashboard -> SQL Editor -> New Query.
-- It links salary records directly with the employee's ID from the 'employees' table:
-- employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE
-- while preserving 'employee_iqama' for backwards compatibility.

-- 1. Add 'employee_id' foreign key column referencing employees(id)
ALTER TABLE public.employee_salaries 
ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE;

-- 2. Backfill existing salary records with employee UUID from employees table
UPDATE public.employee_salaries s
SET employee_id = e.id
FROM public.employees e
WHERE (s.employee_iqama = e.iqama_number OR s.employee_iqama = e.email)
  AND s.employee_id IS NULL;

-- 3. High-performance indexes for lightning-fast queries and filtering
CREATE INDEX IF NOT EXISTS idx_employee_salaries_employee_id 
ON public.employee_salaries(employee_id);

CREATE INDEX IF NOT EXISTS idx_employee_salaries_employee_id_month 
ON public.employee_salaries(employee_id, month);

-- Optional unique index to prevent duplicate salary slips per employee per month
CREATE UNIQUE INDEX IF NOT EXISTS idx_employee_salaries_unique_emp_month 
ON public.employee_salaries(employee_id, month) 
WHERE employee_id IS NOT NULL;

-- 4. Reload PostgREST schema cache to ensure immediate API reflection
NOTIFY pgrst, 'reload schema';

-- =========================================================================
-- Verification Query (Run to confirm):
-- SELECT id, employee_id, employee_iqama, month, basic_salary, net_salary, status 
-- FROM public.employee_salaries 
-- LIMIT 5;
-- =========================================================================
