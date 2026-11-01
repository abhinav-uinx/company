import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/app/actions/auth';
import { hashPassword, isBcryptHash } from '@/lib/passwords';
import { sanitizeObject } from '@/lib/security';
import { logSecurityEvent } from '@/lib/securityAudit';

const DEFAULT_SUPABASE_URL = 'https://umwkgcbfvshsvdpqizyq.supabase.co';
const DEFAULT_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtd2tnY2JmdnNoc3ZkcHFpenlxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODk3NzIyMSwiZXhwIjoyMTA0NTUzMjIxfQ.NwuDdMbB658MD4x6XVwhmPB_iBjHgfJgj1cPHSrqTr8';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_KEY || DEFAULT_SERVICE_KEY;

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

// In-memory cache for fast GET responses (20s TTL) with instant invalidation on mutations
interface CachedProxyResponse {
  status: number;
  body: string;
  contentType: string;
  headers: Record<string, string>;
  timestamp: number;
}

const proxyGetCache = new Map<string, CachedProxyResponse>();
const PROXY_CACHE_TTL = 20000; // 20 seconds

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

  // Invalidate cache on mutations for the target table
  if (req.method !== 'GET' && req.method !== 'HEAD' && targetTable) {
    proxyGetCache.forEach((_, key) => {
      if (key.includes(targetTable)) {
        proxyGetCache.delete(key);
      }
    });
  }

  // Enforce role-based access for administrative tables (NIST SP 800-53 AC-3 / AC-4)
  if (session.role !== 'admin') {
    const adminOnlyTables = ['admins', 'active_sessions', 'payment_history', 'employee_salaries', 'security_audit_logs'];
    if (adminOnlyTables.includes(targetTable)) {
      await logSecurityEvent({
        eventType: 'PRIVILEGE_VIOLATION',
        severity: 'WARN',
        actor: (session.username as string) || 'unknown',
        details: { table: targetTable, method: req.method }
      });
      return NextResponse.json({ error: 'Forbidden. Admin privileges required.' }, { status: 403 });
    }
    // Non-admins cannot modify (POST/PATCH/PUT/DELETE) employees
    if (targetTable === 'employees' && req.method !== 'GET') {
      await logSecurityEvent({
        eventType: 'PRIVILEGE_VIOLATION',
        severity: 'WARN',
        actor: (session.username as string) || 'unknown',
        details: { table: 'employees', action: 'modify_attempt', method: req.method }
      });
      return NextResponse.json({ error: 'Forbidden. Admin privileges required to modify employee records.' }, { status: 403 });
    }
  }

  // 2. Reconstruct the Supabase URL
  const path = pathArray ? pathArray.join('/') : '';
  const searchParams = req.nextUrl.search;
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const targetUrl = `${baseUrl}/${path}${searchParams}`;

  // Check GET cache for instant response (<1ms)
  if (req.method === 'GET') {
    const cached = proxyGetCache.get(targetUrl);
    if (cached && (Date.now() - cached.timestamp < PROXY_CACHE_TTL)) {
      return new NextResponse(cached.body, {
        status: cached.status,
        headers: {
          ...cached.headers,
          'X-Proxy-Cache': 'HIT'
        }
      });
    }
  }

  // 3. Clean, safe headers for Supabase (strips hop-by-hop headers, cookies, and invalid fetch headers)
  const activeKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_KEY || SUPABASE_SERVICE_KEY || DEFAULT_SERVICE_KEY;
  const headers = new Headers();
  headers.set('apikey', activeKey);
  headers.set('Authorization', `Bearer ${activeKey}`);

  req.headers.forEach((val, key) => {
    const lower = key.toLowerCase();
    if (
      lower === 'accept' ||
      lower === 'content-type' ||
      lower === 'prefer' ||
      lower === 'range' ||
      lower === 'range-unit' ||
      (lower.startsWith('x-') && !lower.startsWith('x-forwarded-') && lower !== 'x-real-ip')
    ) {
      headers.set(key, val);
    }
  });

  const fetchOptions: RequestInit = {
    method: req.method,
    headers,
  };

  if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
    const isJson = (headers.get('content-type') || '').includes('json');
    if (isJson) {
      try {
        const rawText = await req.text();
        if (rawText) {
          let parsed = sanitizeObject(JSON.parse(rawText));
          if ((targetTable === 'employees' || targetTable === 'admins') && ['POST', 'PATCH', 'PUT'].includes(req.method)) {
            const processItem = async (item: any) => {
              if (item && typeof item === 'object' && typeof item.password === 'string' && item.password.trim()) {
                if (!isBcryptHash(item.password)) {
                  item.password = await hashPassword(item.password.trim());
                }
              }
            };

            if (Array.isArray(parsed)) {
              for (const item of parsed) {
                await processItem(item);
              }
            } else {
              await processItem(parsed);
            }
          }

          const newBody = JSON.stringify(parsed);
          fetchOptions.body = newBody;
          headers.set('content-type', 'application/json');
          headers.set('content-length', Buffer.byteLength(newBody).toString());
        }
      } catch (err) {
        console.error('Error processing request body in proxy route:', err);
        fetchOptions.body = req.body;
        // @ts-ignore
        fetchOptions.duplex = 'half';
      }
    } else {
      fetchOptions.body = req.body;
      // @ts-ignore
      fetchOptions.duplex = 'half';
    }
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

    // If response is JSON, sanitize credentials if applicable and cache
    if (contentType.includes('json')) {
      const text = await response.text();
      let outputBody = text;

      // Only run recursive sanitization for tables with passwords
      if (targetTable === 'admins' || targetTable === 'employees') {
        try {
          const json = JSON.parse(text);
          const sanitized = sanitizeData(json);
          outputBody = JSON.stringify(sanitized);
        } catch {}
      }

      const outHeaders = {
        ...Object.fromEntries(responseHeaders.entries()),
        'Content-Type': contentType || 'application/json'
      };

      // Cache successful GET requests
      if (req.method === 'GET' && response.status === 200) {
        proxyGetCache.set(targetUrl, {
          status: 200,
          body: outputBody,
          contentType: contentType || 'application/json',
          headers: outHeaders,
          timestamp: Date.now()
        });
      }

      return new NextResponse(outputBody, {
        status: response.status,
        headers: outHeaders
      });
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
    console.error('SUPABASE PROXY ERROR:', error);
    return NextResponse.json({ error: error?.message || 'Proxy error', details: String(error) }, { status: 500 });
  }
}
