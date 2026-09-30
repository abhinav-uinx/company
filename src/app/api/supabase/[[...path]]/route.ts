import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/app/actions/auth';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_KEY!;

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

// Recursively strip sensitive fields like password
function sanitizeData(data: any): any {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(sanitizeData);
  const clean = { ...data };
  delete clean.password;
  delete clean.temp_password;
  for (const key of Object.keys(clean)) {
    if (typeof clean[key] === 'object' && clean[key] !== null) {
      clean[key] = sanitizeData(clean[key]);
    }
  }
  return clean;
}

async function handleRequest(req: NextRequest, pathArray?: string[]) {
  // 1. Authenticate request via session
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized. Session required.' }, { status: 401 });
  }

  // Correctly extract the table name from PostgREST path: /rest/v1/<table_name>
  let targetTable = '';
  if (pathArray && pathArray[0] === 'rest' && pathArray[1] === 'v1' && pathArray[2]) {
    targetTable = pathArray[2];
  } else if (pathArray && pathArray.length > 0) {
    targetTable = pathArray[0];
  }

  // Enforce role-based access for administrative tables
  if (session.role !== 'admin') {
    const adminOnlyTables = ['admins', 'active_sessions', 'employees', 'payment_history', 'employee_salaries'];
    if (adminOnlyTables.includes(targetTable)) {
      return NextResponse.json({ error: 'Forbidden. Admin privileges required.' }, { status: 403 });
    }
  }

  // 2. Reconstruct the Supabase URL
  const path = pathArray ? pathArray.join('/') : '';
  const searchParams = req.nextUrl.search;
  const targetUrl = `${SUPABASE_URL}/${path}${searchParams}`;

  // 3. Forward headers, injecting Service Role Key safely from server
  const headers = new Headers(req.headers);
  headers.set('apikey', SUPABASE_SERVICE_KEY);
  headers.set('Authorization', `Bearer ${SUPABASE_SERVICE_KEY}`);
  headers.delete('host');

  const fetchOptions: RequestInit = {
    method: req.method,
    headers,
  };

  if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
    fetchOptions.body = req.body;
    // @ts-ignore
    fetchOptions.duplex = 'half';
  }

  // 4. Proxy the request to Supabase
  try {
    const response = await fetch(targetUrl, fetchOptions);

    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete('content-encoding');
    responseHeaders.delete('content-length');

    if (response.status === 204) {
      return new NextResponse(null, { status: 204, headers: responseHeaders });
    }

    const contentType = response.headers.get('content-type') || '';

    // If response is JSON, sanitize out sensitive data (passwords) so they never reach browser
    if (contentType.includes('application/json')) {
      const text = await response.text();
      try {
        const json = JSON.parse(text);
        const sanitized = sanitizeData(json);
        return new NextResponse(JSON.stringify(sanitized), {
          status: response.status,
          headers: {
            ...Object.fromEntries(responseHeaders.entries()),
            'Content-Type': 'application/json'
          }
        });
      } catch {
        return new NextResponse(text, {
          status: response.status,
          headers: {
            ...Object.fromEntries(responseHeaders.entries()),
            'Content-Type': 'application/json'
          }
        });
      }
    }

    // For non-JSON (binary streams, images, PDFs, etc.)
    const data = await response.arrayBuffer();
    return new NextResponse(data, {
      status: response.status,
      headers: {
        ...Object.fromEntries(responseHeaders.entries()),
        'Content-Type': contentType || 'application/octet-stream'
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
