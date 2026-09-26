CREATE OR REPLACE FUNCTION public.fix_my_schema()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result text := '';
BEGIN
    -- Drop duplicate keys
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'documentation_services_patient_id_fkey') THEN
        ALTER TABLE public.documentation_services DROP CONSTRAINT documentation_services_patient_id_fkey;
        result := result || 'Dropped documentation_services_patient_id_fkey. ';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_doc_patient') THEN
        ALTER TABLE public.documentation_services DROP CONSTRAINT fk_doc_patient;
        result := result || 'Dropped fk_doc_patient. ';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_doc_customer') THEN
        ALTER TABLE public.documentation_services DROP CONSTRAINT fk_doc_customer;
        result := result || 'Dropped fk_doc_customer. ';
    END IF;

    -- Add the one true key
    ALTER TABLE public.documentation_services ADD CONSTRAINT fk_doc_customer FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;
    result := result || 'Added clean fk_doc_customer. ';

    -- Force schema cache reload
    NOTIFY pgrst, 'reload schema';

    RETURN result;
END;
$$;
