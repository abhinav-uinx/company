import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/app/actions/auth';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_KEY!; // Must use service role to bypass RLS internally

export async function GET(req: NextRequest, { params }: { params: { path?: string[] } }) {
  return handleRequest(req, params.path);
}
export async function POST(req: NextRequest, { params }: { params: { path?: string[] } }) {
  return handleRequest(req, params.path);
}
export async function PATCH(req: NextRequest, { params }: { params: { path?: string[] } }) {
  return handleRequest(req, params.path);
}
export async function PUT(req: NextRequest, { params }: { params: { path?: string[] } }) {
  return handleRequest(req, params.path);
}
export async function DELETE(req: NextRequest, { params }: { params: { path?: string[] } }) {
  return handleRequest(req, params.path);
}

async function handleRequest(req: NextRequest, pathArray?: string[]) {
  // 1. Authenticate the request via custom cookie
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized. RLS policy enforced by proxy.' }, { status: 401 });
  }

  const table = pathArray ? pathArray[0] : '';
  
  // Enforce RLS rules inside the proxy based on the custom session
  if (session.role !== 'admin') {
    // Employees cannot access these tables
    const adminOnlyTables = ['admins', 'active_sessions', 'employees', 'payment_history'];
    if (adminOnlyTables.includes(table)) {
      return NextResponse.json({ error: 'Forbidden. Admin privileges required.' }, { status: 403 });
    }
  }

  // 2. Reconstruct the Supabase URL
  const path = pathArray ? pathArray.join('/') : '';
  const searchParams = req.nextUrl.search;
  const targetUrl = `${SUPABASE_URL}/${path}${searchParams}`;

  // 3. Forward headers, but replace Anon Key with Service Role Key
  const headers = new Headers(req.headers);
  headers.set('apikey', SUPABASE_SERVICE_KEY);
  headers.set('Authorization', `Bearer ${SUPABASE_SERVICE_KEY}`);
  // Remove host header to avoid SSL mismatch
  headers.delete('host');

  const fetchOptions: RequestInit = {
    method: req.method,
    headers,
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const text = await req.text();
    if (text) fetchOptions.body = text;
  }

  // 4. Proxy the request
  try {
    const response = await fetch(targetUrl, fetchOptions);
    const data = await response.text();

    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete('content-encoding'); // Let Next.js handle encoding

    return new NextResponse(data, {
      status: response.status,
      headers: {
        ...Object.fromEntries(responseHeaders.entries()),
        'Content-Type': responseHeaders.get('content-type') || 'application/json'
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
