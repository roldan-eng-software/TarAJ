// Admin User Detail API Route Handler
// Get, update and manage individual user — restricted to administrators

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/src/lib/session';
import { getUser, updateUser } from '@/src/domain/auth/user-service';

// ── GET /api/admin/users/[userId] ───────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUser(session, userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error: any) {
    if (error?.message?.includes('cannot')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }
    console.error('Error getting user:', error);
    return NextResponse.json({ error: 'Failed to get user' }, { status: 500 });
  }
}

// ── PATCH /api/admin/users/[userId] ─────────────────────────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate role if provided
    if (body.roleId) {
      const validRoles = ['administrator', 'coordinator', 'collaborator', 'internal_reader'];
      if (!validRoles.includes(body.roleId)) {
        return NextResponse.json({ error: 'Papel inválido' }, { status: 422 });
      }
    }

    // Validate status if provided
    if (body.status && !['active', 'disabled'].includes(body.status)) {
      return NextResponse.json({ error: 'Status inválido' }, { status: 422 });
    }

    const updated = await updateUser(
      userId,
      {
        displayName: body.displayName,
        roleId: body.roleId,
        status: body.status,
      },
      session
    );

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error?.message?.includes('cannot')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }
    if (error?.message === 'User not found') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
