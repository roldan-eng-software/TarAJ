import type { NextRequest } from 'next/server';
import { getSessionUser, getSessionUserFromCookie } from '@/src/domain/auth/auth-service';
import type { SessionUser } from '@/src/types/domain';

export async function getSessionFromRequest(
  request: NextRequest
): Promise<SessionUser | null> {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return getSessionUser(authHeader.slice(7));
  }

  const sessionCookie = request.cookies.get('session')?.value;
  if (sessionCookie) {
    return getSessionUserFromCookie(sessionCookie);
  }

  return null;
}
