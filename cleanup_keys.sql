-- Drop redundant auto-generated foreign keys to prevent PostgREST ambiguity errors

DO $$
BEGIN
    -- Documentation Services
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'documentation_services_patient_id_fkey') THEN
        ALTER TABLE public.documentation_services DROP CONSTRAINT documentation_services_patient_id_fkey;
    END IF;

    -- Invoices
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invoices_patient_id_fkey') THEN
        ALTER TABLE public.invoices DROP CONSTRAINT invoices_patient_id_fkey;
    END IF;

    -- Payment History
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payment_history_invoice_id_fkey') THEN
        ALTER TABLE public.payment_history DROP CONSTRAINT payment_history_invoice_id_fkey;
    END IF;
    
    -- Employees
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'employees_department_id_fkey') THEN
        ALTER TABLE public.employees DROP CONSTRAINT employees_department_id_fkey;
    END IF;
END $$;
