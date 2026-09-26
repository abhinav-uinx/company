CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.admins (
    username TEXT PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT,
    status TEXT DEFAULT 'active',
    permissions TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.employees (
    iqama_number TEXT PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT,
    department_id UUID,
    status TEXT DEFAULT 'active',
    permissions TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.documentation_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.escort_missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status TEXT,
    escort_employee_iqama TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID,
    total_amount NUMERIC DEFAULT 0,
    advance_payment NUMERIC DEFAULT 0,
    balance_amount NUMERIC DEFAULT 0,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.payment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID,
    amount NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.medif_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID,
    document_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_employee_dept') THEN
        ALTER TABLE public.employees ADD CONSTRAINT fk_employee_dept FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_doc_patient') THEN
        ALTER TABLE public.documentation_services ADD CONSTRAINT fk_doc_patient FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_mission_escort') THEN
        ALTER TABLE public.escort_missions ADD CONSTRAINT fk_mission_escort FOREIGN KEY (escort_employee_iqama) REFERENCES public.employees(iqama_number) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_invoice_patient') THEN
        ALTER TABLE public.invoices ADD CONSTRAINT fk_invoice_patient FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_payment_invoice') THEN
        ALTER TABLE public.payment_history ADD CONSTRAINT fk_payment_invoice FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;
    END IF;


END
$$;

ALTER TABLE public.admins DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentation_services DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.escort_missions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.medif_records DISABLE ROW LEVEL SECURITY;


