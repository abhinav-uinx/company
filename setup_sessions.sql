CREATE TABLE public.active_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT NOT NULL,
    role TEXT NOT NULL,
    ip_address TEXT,
    location TEXT,
    user_agent TEXT,
    browser TEXT,
    os TEXT,
    device TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    is_active BOOLEAN DEFAULT true
);

-- Optional: add an index for faster lookups by username
CREATE INDEX idx_active_sessions_username ON public.active_sessions(username);
