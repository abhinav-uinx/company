-- 1. Enable RLS on all tables
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escort_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.general_service_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doc_service_types ENABLE ROW LEVEL SECURITY;

-- 2. Grant basic read/write access to authenticated users
-- Note: Because this app uses custom JWT auth (and NOT Supabase Auth), 
-- queries are running via the Service Role key or a proxy.
-- We will allow 'authenticated' and 'anon' roles basic access for now, 
-- but rely on our Next.js API Proxy & AuthGuard to prevent unauthorized access.

CREATE POLICY "Allow read access" ON public.customers FOR SELECT USING (true);
CREATE POLICY "Allow insert access" ON public.customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update access" ON public.customers FOR UPDATE USING (true);

CREATE POLICY "Allow read access" ON public.escort_missions FOR SELECT USING (true);
CREATE POLICY "Allow insert access" ON public.escort_missions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update access" ON public.escort_missions FOR UPDATE USING (true);

CREATE POLICY "Allow read access" ON public.general_service_records FOR SELECT USING (true);
CREATE POLICY "Allow insert access" ON public.general_service_records FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update access" ON public.general_service_records FOR UPDATE USING (true);

CREATE POLICY "Allow read access" ON public.invoices FOR SELECT USING (true);
CREATE POLICY "Allow insert access" ON public.invoices FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update access" ON public.invoices FOR UPDATE USING (true);

CREATE POLICY "Allow read access" ON public.employees FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON public.services FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON public.doc_service_types FOR SELECT USING (true);

-- Admins and passwords should be locked down. 
-- Only the service_role key (used by our server actions) can read passwords.
CREATE POLICY "Deny public admin access" ON public.admins FOR ALL USING (false);
CREATE POLICY "Deny public sessions access" ON public.active_sessions FOR ALL USING (false);
