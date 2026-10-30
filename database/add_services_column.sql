-- =========================================================================
-- Multi-Service Support Migration for Customers
-- =========================================================================
-- Run this in your Supabase SQL Editor to allow customers to have
-- multiple service types (e.g. Medical Escort, General Service, or both).

-- 1. Add services column as JSONB array to store multiple service IDs
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS services JSONB DEFAULT '[]'::jsonb;

-- 2. Backfill existing customer's single 'service' into the 'services' array
UPDATE public.customers
SET services = jsonb_build_array(service)
WHERE service IS NOT NULL AND (services IS NULL OR services = '[]'::jsonb);

-- 3. Create GIN index for fast array membership queries
CREATE INDEX IF NOT EXISTS idx_customers_services ON public.customers USING gin(services);
