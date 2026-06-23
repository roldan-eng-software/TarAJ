import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { adminAuth, adminDb } from '@/src/firebase/admin';
import { getSessionUserFromCookie } from '@/src/domain/auth/auth-service';
import { checkRateLimit, getRateLimitHeaders } from '@/src/lib/rate-limit';
import { logLoginAttempt } from '@/src/domain/audit/audit-service';

const SESSION_MAX_AGE = 14 * 24 * 60 * 60; // 14 days in seconds
const SESSION_EXPIRES_MS = 14 * 24 * 60 * 60 * 1000; // 14 days in ms

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

    let idToken: string | null = null;
    let email: string | null = null;

    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await request.json().catch(() => ({}));
      idToken = body.idToken || null;
      email = body.email || null;
    }

    if (!idToken) {
      const authHeader = request.headers.get('authorization');
      idToken = authHeader?.replace('Bearer ', '') || null;
    }

    if (!idToken) {
      if (email) {
        await logLoginAttempt(email, false, 'No token provided');
      }
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_EXPIRES_MS,
    });

    const sessionUser = await getSessionUserFromCookie(sessionCookie);

    if (!sessionUser) {
      if (email) {
        await logLoginAttempt(email, false, 'Invalid token or user not found');
      }
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (email) {
      await logLoginAttempt(email, true);
    }

    await adminDb.collection('users').doc(sessionUser.uid).update({
      lastLoginAt: new Date(),
    }).catch(() => {});

    const response = NextResponse.json(sessionUser);

    response.cookies.set('session', sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE,
    });

    return response;
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json({ error: 'Session error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('session')?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: 'No session' }, { status: 401 });
    }

    const sessionUser = await getSessionUserFromCookie(sessionCookie);

    if (!sessionUser) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    return NextResponse.json(sessionUser);
  } catch (error) {
    console.error('Session GET error:', error);
    return NextResponse.json({ error: 'Session error' }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });

  response.cookies.set('session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return response;
}
