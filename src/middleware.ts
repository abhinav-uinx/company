import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret');

// Protected application route prefixes
const PROTECTED_PREFIXES = [
  '/admin',
  '/user',
  '/dashboard',
  '/customers',
  '/escorts',
  '/documentation',
  '/invoices',
  '/vault',
  '/forms',
  '/reports',
  '/create'
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get('session')?.value;

  let sessionPayload: { username?: string; role?: string; name?: string } | null = null;

  if (sessionCookie) {
    try {
      const { payload } = await jwtVerify(sessionCookie, JWT_SECRET);
      sessionPayload = payload as { username?: string; role?: string; name?: string };
    } catch (e) {
      // Invalid, expired, or tampered token
      sessionPayload = null;
    }
  }

  const isAuthenticated = Boolean(sessionPayload && sessionPayload.username);

  // 1. Root redirect handling: direct to appropriate destination
  if (pathname === '/') {
    if (isAuthenticated) {
      const target = sessionPayload?.role === 'admin' ? '/admin/dashboard' : '/user/dashboard';
      return NextResponse.redirect(new URL(target, request.url));
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. Prevent authenticated users from staying on login page
  if (pathname === '/login') {
    if (isAuthenticated) {
      const target = sessionPayload?.role === 'admin' ? '/admin/dashboard' : '/user/dashboard';
      return NextResponse.redirect(new URL(target, request.url));
    }
    return NextResponse.next();
  }

  // 3. Access enforcement for protected routes (NIST SP 800-53 AC-3 / AC-4)
  const isProtectedRoute = PROTECTED_PREFIXES.some(prefix =>
    pathname === prefix || pathname.startsWith(prefix + '/')
  );

  if (isProtectedRoute) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      const response = NextResponse.redirect(loginUrl);
      // Clean up stale or invalid cookie
      if (sessionCookie) {
        response.cookies.delete('session');
      }
      return response;
    }

    // Role-based privilege enforcement: prevent non-admins from accessing /admin routes
    if (pathname.startsWith('/admin') && sessionPayload?.role !== 'admin') {
      // Allow employee access only to /admin/reports if authorized by client guard
      if (!pathname.startsWith('/admin/reports')) {
        return NextResponse.redirect(new URL('/user/dashboard', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static assets)
     * - _next/image (image optimization files)
     * - favicon.ico, icon.png, apple-icon.png (icons)
     * - api routes (handled by API Route Handlers)
     */
    '/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|api/).*)',
  ],
};
