import { NextResponse } from 'next/server';
import { getSession } from '@/app/actions/auth';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false, error: 'Not authenticated' }, { status: 401 });
  }

  const { username, role } = session as { username: string; role: string };
  const table = role === 'admin' ? 'admins' : 'employees';
  const idField = role === 'admin' ? 'username' : 'iqama_number';

  try {
    const { data, error } = await supabaseAdmin
      .from(table)
      .select('status, permissions')
      .eq(idField, username)
      .single();

    if (error || !data) {
      return NextResponse.json({
        authenticated: true,
        status: 'active',
        permissions: []
      });
    }

    return NextResponse.json({
      authenticated: true,
      status: data.status || 'active',
      permissions: data.permissions || []
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
