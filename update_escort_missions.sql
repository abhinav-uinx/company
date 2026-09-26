-- 1. Remove the self-referencing "mission_id" column if that's what you meant
ALTER TABLE public.escort_missions 
  DROP COLUMN IF EXISTS mission_id;

-- (WARNING: If you actually meant to drop the primary key "id", uncomment the line below. 
-- But this is NOT recommended as React needs an 'id' to display rows properly!)
-- ALTER TABLE public.escort_missions DROP COLUMN IF EXISTS id;

-- 2. Rename patient_id to customer_id (this preserves existing data)
ALTER TABLE public.escort_missions 
  RENAME COLUMN patient_id TO customer_id;

-- 3. Update the foreign key to point to the customers table
ALTER TABLE public.escort_missions 
  DROP CONSTRAINT IF EXISTS escort_missions_patient_id_fkey,
  DROP CONSTRAINT IF EXISTS escort_missions_customer_id_fkey;

ALTER TABLE public.escort_missions
  ADD CONSTRAINT escort_missions_customer_id_fkey 
  FOREIGN KEY (customer_id) 
  REFERENCES public.customers(id) 
  ON DELETE CASCADE;

-- 4. Reload the Supabase cache so the app sees the changes
NOTIFY pgrst, 'reload schema';
