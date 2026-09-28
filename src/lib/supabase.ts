import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables.");
}

const isBrowser = typeof window !== 'undefined';
// supabase-js requires an absolute URL
const clientUrl = isBrowser ? window.location.origin + '/api/supabase' : supabaseUrl;
export const supabaseAuth = createClient(clientUrl || '', supabaseKey || '');

// Admin client for secure server-side operations
export const supabaseAdmin = createClient(supabaseUrl || '', process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey || '');

