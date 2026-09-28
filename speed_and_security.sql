CREATE TABLE IF NOT EXISTS public.login_attempts (
    identifier VARCHAR(255) PRIMARY KEY,
    attempts INT DEFAULT 0,
    lockout_until TIMESTAMPTZ,
    last_attempt TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Indexes for blazing fast fetching and performance
CREATE INDEX IF NOT EXISTS idx_customers_service ON public.customers(service);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON public.customers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_active_sessions_username ON public.active_sessions(username);
CREATE INDEX IF NOT EXISTS idx_active_sessions_id_active ON public.active_sessions(id, is_active);
CREATE INDEX IF NOT EXISTS idx_employee_attendance_date ON public.employee_attendance(date DESC);
CREATE INDEX IF NOT EXISTS idx_employee_attendance_iqama ON public.employee_attendance(employee_iqama);
