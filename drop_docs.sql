-- Drop the documentation_services table safely
DROP TABLE IF EXISTS public.documentation_services CASCADE;

-- Add service_type column to customers to hold multiple UUIDs
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS service_type UUID[] DEFAULT '{}';

-- Force cache reload
NOTIFY pgrst, 'reload schema';
