import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSessionUser } from '@/src/domain/auth/auth-service';
import { checkRateLimit, getRateLimitHeaders } from '@/src/lib/rate-limit';
import { logLoginAttempt } from '@/src/domain/audit/audit-service';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(`session:${ip}`, 10, 60000)) {
      const headers = getRateLimitHeaders(`session:${ip}`, 10);
      return NextResponse.json(
        { error: 'Too many requests. Tente novamente mais tarde.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((headers.resetAt - Date.now()) / 1000)),
          },
        }
      );
    }

    let token: string | null = null;
    let email: string | null = null;

    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await request.json().catch(() => ({}));
      token = body.idToken || null;
      email = body.email || null;
    }

    if (!token) {
      const authHeader = request.headers.get('authorization');
      token = authHeader?.replace('Bearer ', '') || null;
    }

    if (!token) {
      if (email) {
        await logLoginAttempt(email, false, 'No token provided');
      }
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const sessionUser = await getSessionUser(token);

    if (!sessionUser) {
      if (email) {
        await logLoginAttempt(email, false, 'Invalid token or user not found');
      }
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (email) {
      await logLoginAttempt(email, true);
    }

    const response = NextResponse.json(sessionUser);

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 86400,
    });

    return response;
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json({ error: 'Session error' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });

  response.cookies.set('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No session' }, { status: 401 });
    }

    const sessionUser = await getSessionUser(token);

    if (!sessionUser) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    return NextResponse.json(sessionUser);
  } catch (error) {
    console.error('Session GET error:', error);
    return NextResponse.json({ error: 'Session error' }, { status: 500 });
  }
}
