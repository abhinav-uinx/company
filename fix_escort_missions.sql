-- 1. If the old column patient_id still exists, rename it to customer_id in escort_missions
DO $$ 
BEGIN
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='escort_missions' and column_name='patient_id') THEN
      ALTER TABLE "public"."escort_missions" RENAME COLUMN "patient_id" TO "customer_id";
  END IF;
  
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='invoices' and column_name='patient_id') THEN
      ALTER TABLE "public"."invoices" RENAME COLUMN "patient_id" TO "customer_id";
  END IF;
END $$;

-- 2. Ensure foreign keys point to customers instead of patients
ALTER TABLE "public"."escort_missions" DROP CONSTRAINT IF EXISTS escort_missions_patient_id_fkey, DROP CONSTRAINT IF EXISTS escort_missions_customer_id_fkey;
ALTER TABLE "public"."invoices" DROP CONSTRAINT IF EXISTS invoices_patient_id_fkey, DROP CONSTRAINT IF EXISTS invoices_customer_id_fkey;

ALTER TABLE "public"."escort_missions" ADD CONSTRAINT escort_missions_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;
ALTER TABLE "public"."invoices" ADD CONSTRAINT invoices_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;

-- 3. The most important part: Reload the schema cache so Supabase API sees the columns
NOTIFY pgrst, 'reload schema';
