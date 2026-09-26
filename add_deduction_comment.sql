ALTER TABLE public.employee_salaries
ADD COLUMN IF NOT EXISTS deduction_comment TEXT;
