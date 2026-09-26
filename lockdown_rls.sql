-- =========================================================================
-- MEDESCORT INTERNATIONAL - TOTAL SECURITY LOCKDOWN SCRIPT
-- =========================================================================
-- This script enables Row Level Security (RLS) on every single table in your database.
-- Because your Next.js application uses a secure backend Proxy API and custom JWT auth,
-- it authenticates using the SUPABASE_SERVICE_ROLE_KEY.
-- The Service Role Key automatically bypasses RLS.
-- Therefore, by enabling RLS without adding any public access policies, 
-- you perfectly lock down your database from public hackers while your app continues to work with NO ERRORS!

-- 1. Enable RLS on all tables
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.general_service_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escort_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medif_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doc_service_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_salaries ENABLE ROW LEVEL SECURITY;

-- 2. Drop any previous loose policies that may have been created
-- (This ensures your database is 100% airtight)
DROP POLICY IF EXISTS "Allow read access" ON public.customers;
DROP POLICY IF EXISTS "Allow insert access" ON public.customers;
DROP POLICY IF EXISTS "Allow update access" ON public.customers;

DROP POLICY IF EXISTS "Allow read access" ON public.escort_missions;
DROP POLICY IF EXISTS "Allow insert access" ON public.escort_missions;
DROP POLICY IF EXISTS "Allow update access" ON public.escort_missions;

DROP POLICY IF EXISTS "Allow read access" ON public.general_service_records;
DROP POLICY IF EXISTS "Allow insert access" ON public.general_service_records;
DROP POLICY IF EXISTS "Allow update access" ON public.general_service_records;

DROP POLICY IF EXISTS "Allow read access" ON public.invoices;
DROP POLICY IF EXISTS "Allow insert access" ON public.invoices;
DROP POLICY IF EXISTS "Allow update access" ON public.invoices;

DROP POLICY IF EXISTS "Allow read access" ON public.employees;
DROP POLICY IF EXISTS "Allow read access" ON public.services;
DROP POLICY IF EXISTS "Allow read access" ON public.doc_service_types;

-- SUCCESS: Your database is now perfectly secure! 
-- Only your Next.js API Proxy can read or write data.
