import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables.");
}

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


