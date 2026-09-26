-- Add the array column to store multiple service types
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS service_ids UUID[] DEFAULT '{}';

-- Safely copy any existing single service_id into the new array
UPDATE public.customers 
SET service_ids = ARRAY[service_id] 
WHERE service_id IS NOT NULL AND service_ids = '{}';

-- (Optional) We leave the old service_id column intact for now to ensure no data is lost during the transition
