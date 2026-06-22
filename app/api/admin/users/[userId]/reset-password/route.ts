// Admin User Password Reset API Route Handler
// Generates password reset link — restricted to administrators

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/src/lib/session';
import { resetUserPassword } from '@/src/domain/auth/user-service';

// ── POST /api/admin/users/[userId]/reset-password ───────────────
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resetLink = await resetUserPassword(userId, session);

    return NextResponse.json({ resetLink });
  } catch (error: any) {
    if (error?.message?.includes('cannot')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }
    if (error?.message === 'User not found') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    console.error('Error resetting password:', error);
    return NextResponse.json(
      { error: 'Failed to generate reset link' },
      { status: 500 }
    );
  }
}
