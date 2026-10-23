-- Performance Indexes for instant database queries across the entire app
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON public.customers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customers_service ON public.customers(service);
CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers(name);

CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON public.invoices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON public.invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);

CREATE INDEX IF NOT EXISTS idx_escort_missions_created_at ON public.escort_missions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_escort_missions_customer_id ON public.escort_missions(customer_id);
CREATE INDEX IF NOT EXISTS idx_escort_missions_status ON public.escort_missions(status);

CREATE INDEX IF NOT EXISTS idx_gsr_created_at ON public.general_service_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gsr_customer_id ON public.general_service_records(customer_id);
CREATE INDEX IF NOT EXISTS idx_gsr_status ON public.general_service_records(status);

CREATE INDEX IF NOT EXISTS idx_active_sessions_lookup ON public.active_sessions(id, is_active);
