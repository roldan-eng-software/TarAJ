import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicPaths = ['/login', '/forgot-password'];
const publicApiPaths = ['/api/auth/session', '/api/auth/forgot-password'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('session')?.value;

  const isPublic = publicPaths.some((p) => pathname === p || pathname.startsWith(p + '/'));
  const isPublicApi = publicApiPaths.some((p) => pathname.startsWith(p));
  const isApi = pathname.startsWith('/api/');
  const isStatic =
    pathname.startsWith('/_next/') || pathname.startsWith('/favicon') || pathname === '/';

  if (isStatic || isPublic || isPublicApi) {
    return NextResponse.next();
  }

  if (!token) {
    if (isApi) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
