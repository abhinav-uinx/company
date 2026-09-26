-- 1. Drop the incorrect foreign key constraint on the "id" column
ALTER TABLE public.escort_missions 
  DROP CONSTRAINT IF EXISTS escort_missions_id_fkey;

-- 2. Ensure "id" is simply the primary key with a default random UUID (in case it got altered)
ALTER TABLE public.escort_missions 
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 3. Reload schema cache just in case
NOTIFY pgrst, 'reload schema';
