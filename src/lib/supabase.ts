import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables.");
}

export const supabaseAuth = createClient(supabaseUrl || '', supabaseKey || '');

// Admin client for secure server-side operations
export const supabaseAdmin = createClient(supabaseUrl || '', process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey || '');
