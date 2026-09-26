-- Rename the table
ALTER TABLE IF EXISTS public.patients RENAME TO customers;

-- Create Services table
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE
);

-- Insert the two main services if they don't exist
INSERT INTO public.services (name) VALUES ('Medical Escort'), ('General Service') ON CONFLICT (name) DO NOTHING;

-- Add service_id to customers
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS service_id UUID;

-- Rename foreign key columns safely
DO $$
BEGIN
    -- documentation_services
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documentation_services' AND column_name = 'patient_id') THEN
        ALTER TABLE public.documentation_services RENAME COLUMN patient_id TO customer_id;
    END IF;

    -- invoices
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'patient_id') THEN
        ALTER TABLE public.invoices RENAME COLUMN patient_id TO customer_id;
    END IF;

    -- medif_records
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medif_records' AND column_name = 'patient_id') THEN
        ALTER TABLE public.medif_records RENAME COLUMN patient_id TO customer_id;
    END IF;

    -- Establish FK for service_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_customer_service') THEN
        ALTER TABLE public.customers ADD CONSTRAINT fk_customer_service FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Disable RLS just in case
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.services DISABLE ROW LEVEL SECURITY;
