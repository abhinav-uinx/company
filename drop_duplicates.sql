-- Drop the duplicate foreign key causing the PGRST201 error
ALTER TABLE public.documentation_services DROP CONSTRAINT IF EXISTS documentation_services_patient_id_fkey;
ALTER TABLE public.documentation_services DROP CONSTRAINT IF EXISTS fk_doc_patient;

-- Recreate exactly ONE foreign key for documentation_services
ALTER TABLE public.documentation_services ADD CONSTRAINT fk_doc_customer FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;

-- Do the same for invoices
ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_patient_id_fkey;
ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS fk_invoice_patient;
ALTER TABLE public.invoices ADD CONSTRAINT fk_invoice_customer FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;
