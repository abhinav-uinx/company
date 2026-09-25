import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://umwkgcbfvshsvdpqizyq.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtd2tnY2JmdnNoc3ZkcHFpenlxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODk3NzIyMSwiZXhwIjoyMTA0NTUzMjIxfQ.NwuDdMbB658MD4x6XVwhmPB_iBjHgfJgj1cPHSrqTr8';

export const supabaseAuth = createClient(supabaseUrl, supabaseKey);
