import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://umwkgcbfvshsvdpqizyq.supabase.co';
const DEFAULT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtd2tnY2JmdnNoc3ZkcHFpenlxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODk3NzIyMSwiZXhwIjoyMTA0NTUzMjIxfQ.NwuDdMbB658MD4x6XVwhmPB_iBjHgfJgj1cPHSrqTr8';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || DEFAULT_SUPABASE_KEY;

const isBrowser = typeof window !== 'undefined';
// supabase-js requires an absolute URL
const clientUrl = isBrowser ? window.location.origin + '/api/supabase' : supabaseUrl;
// PostgREST client: routes through internal proxy in browser to protect keys & strip passwords
export const supabaseAuth = createClient(clientUrl || '', supabaseKey || '');

// Direct client for Supabase Realtime WebSocket (broadcast, presence)
export const supabaseRealtime = createClient(supabaseUrl || '', supabaseKey || '', {
  realtime: {
    params: {
      eventsPerSecond: 20
    }
  }
});

// Admin client for secure server-side operations
export const supabaseAdmin = createClient(supabaseUrl || '', process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey || '');


