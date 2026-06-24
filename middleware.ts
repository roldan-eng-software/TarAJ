import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicPaths = ['/login', '/forgot-password'];
const publicApiPaths = ['/api/auth/session', '/api/auth/forgot-password'];

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('session')?.value;

  const isPublic = publicPaths.some((p) => pathname === p || pathname.startsWith(p + '/'));
  const isPublicApi = publicApiPaths.some((p) => pathname.startsWith(p));
  const isApi = pathname.startsWith('/api/');
  const isStatic =
    pathname.startsWith('/_next/') || pathname.startsWith('/favicon') || pathname === '/';

  if (isStatic || isPublic || isPublicApi) {
    return addSecurityHeaders(NextResponse.next());
  }

  if (!token) {
    if (isApi) {
      return addSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    }
    return addSecurityHeaders(NextResponse.redirect(new URL('/login', request.url)));
  }

  return addSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
