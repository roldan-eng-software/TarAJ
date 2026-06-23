import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { logLoginAttempt } from '@/src/domain/audit/audit-service';
import { checkRateLimit, getRateLimitHeaders } from '@/src/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(`forgot-password:${ip}`, 5, 60000)) {
      const headers = getRateLimitHeaders(`forgot-password:${ip}`, 5);
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

    const body = await request.json().catch(() => ({}));
    const email = body.email?.trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Email inválido.' }, { status: 422 });
    }

    await logLoginAttempt(email, false, 'Password reset requested');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}
