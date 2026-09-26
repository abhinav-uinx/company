DO $$
BEGIN
    -- Drop array columns safely
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'service_ids') THEN
        ALTER TABLE public.customers DROP COLUMN service_ids;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'doc_service_ids') THEN
        ALTER TABLE public.customers DROP COLUMN doc_service_ids;
    END IF;

    -- Drop the foreign key if it already exists
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_customer_service') THEN
        ALTER TABLE public.customers DROP CONSTRAINT fk_customer_service;
    END IF;

    -- Drop service_id column if we are replacing it
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'service_id') THEN
        ALTER TABLE public.customers DROP COLUMN service_id CASCADE;
    END IF;
    
    -- Ensure service column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'service') THEN
        ALTER TABLE public.customers ADD COLUMN service UUID;
    END IF;
END $$;

-- Add the foreign key outside the DO block
ALTER TABLE public.customers ADD CONSTRAINT fk_customer_service FOREIGN KEY (service) REFERENCES public.services(id) ON DELETE SET NULL;

-- Force cache reload
NOTIFY pgrst, 'reload schema';
