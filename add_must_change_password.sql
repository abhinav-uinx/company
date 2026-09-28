-- Add must_change_password column to employees table
ALTER TABLE public.employees
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT true;
