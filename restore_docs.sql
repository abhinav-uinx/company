-- Recreate the documentation_services table
CREATE TABLE IF NOT EXISTS public.documentation_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID,
    service_type TEXT,
    service_type_ids UUID[] DEFAULT '{}',
    status TEXT DEFAULT 'Applied',
    checklist JSONB DEFAULT '{}'::jsonb,
    expiry_date DATE,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Recreate the clean foreign key
ALTER TABLE public.documentation_services DROP CONSTRAINT IF EXISTS fk_doc_customer;
ALTER TABLE public.documentation_services ADD CONSTRAINT fk_doc_customer FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;

-- Disable RLS
ALTER TABLE public.documentation_services DISABLE ROW LEVEL SECURITY;

-- Force schema cache reload
NOTIFY pgrst, 'reload schema';
