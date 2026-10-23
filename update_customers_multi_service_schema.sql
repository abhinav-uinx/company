-- =========================================================================
-- MEDESCORT INTERNATIONAL - CUSTOMER MULTI-SERVICE TYPES SCHEMA MIGRATION
-- =========================================================================
-- Run this script in your Supabase Dashboard -> SQL Editor -> New Query.
-- It enables storing multiple service types per customer in Customer Management
-- and seamlessly displaying them across Customer Records and the Vault.

-- 1. Add 'services' column as JSONB array to store multiple service IDs
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS services JSONB DEFAULT '[]'::jsonb;

-- 2. Backfill existing customer single 'service' UUIDs into the 'services' array
UPDATE public.customers
SET services = jsonb_build_array(service)
WHERE service IS NOT NULL 
  AND (services IS NULL OR services = '[]'::jsonb);

-- 3. Create GIN index for high-performance array lookups and filtering
CREATE INDEX IF NOT EXISTS idx_customers_services 
ON public.customers USING gin(services);

-- 4. Reload PostgREST schema cache to ensure immediate API reflection
NOTIFY pgrst, 'reload schema';

-- Verification Query (Run this to confirm column status):
-- SELECT id, name, service, services FROM public.customers LIMIT 5;
