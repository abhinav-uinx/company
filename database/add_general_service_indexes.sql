-- Indexes for instant General Services loading and filtering
CREATE INDEX IF NOT EXISTS idx_gsr_created_at ON public.general_service_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gsr_customer_id ON public.general_service_records(customer_id);
CREATE INDEX IF NOT EXISTS idx_gsr_status ON public.general_service_records(status);
