import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { adminAuth } from '@/src/firebase/admin';
import { sendEmail } from '@/src/domain/notifications/email-sender';
import { logLoginAttempt } from '@/src/domain/audit/audit-service';
import { checkRateLimit, getRateLimitHeaders } from '@/src/lib/rate-limit';

const APP_URL = process.env.APP_URL || 'http://localhost:3000';

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

    const resetLink = await adminAuth.generatePasswordResetLink(email, {
      url: `${APP_URL}/login`,
      handleCodeInApp: false,
    });

    await sendEmail({
      to: email,
      subject: '[TarAJ] Redefinição de senha',
      text: `Clique no link abaixo para redefinir sua senha:\n\n${resetLink}\n\nSe você não solicitou esta alteração, ignore este e-mail.`,
      html: `<p>Clique no link abaixo para redefinir sua senha:</p><p><a href="${resetLink}">Redefinir senha</a></p><p style="color:#64748b;font-size:12px">Se você não solicitou esta alteração, ignore este e-mail.</p>`,
    });

    await logLoginAttempt(email, false, 'Password reset link sent');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Forgot password error:', error);
    await logLoginAttempt(emailFromRequest(request), false, 'Password reset failed');
    return NextResponse.json({ error: 'Erro ao processar solicitação.' }, { status: 500 });
  }
}

function emailFromRequest(request: NextRequest): string {
  try {
    const body = JSON.parse(request.headers.get('x-body') || '{}');
    return body.email || 'unknown';
  } catch {
    return 'unknown';
  }
}
