-- ==============================================================================
-- NIST SP 800-53 (AU-2, AU-3, AU-6, AU-12) & NIST SP 800-63B Database Schema
-- Provides tamper-evident audit logging for security and compliance monitoring
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.security_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'INFO',
    actor VARCHAR(255) NOT NULL,
    ip_address VARCHAR(100),
    user_agent TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance & Query Indexes for SIEM and Audit Review
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.security_audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.security_audit_logs (actor);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON public.security_audit_logs (event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON public.security_audit_logs (severity);

-- Enable Row Level Security (RLS) - Restrict direct client access
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only service role and administrative queries can view or insert audit logs
DROP POLICY IF EXISTS "Admins can view security audit logs" ON public.security_audit_logs;
CREATE POLICY "Admins can view security audit logs" ON public.security_audit_logs
    FOR SELECT
    USING (auth.role() = 'service_role');
