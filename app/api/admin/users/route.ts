// Admin Users API Route Handler
// List and create users — restricted to administrators

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSessionUser } from '@/src/domain/auth/auth-service';
import { listUsers, createUserFull } from '@/src/domain/auth/user-service';
import { logDenied } from '@/src/domain/audit/audit-service';

// ── GET /api/admin/users ────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSessionUser(token);
    if (!session) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filters = {
      status: searchParams.get('status') || undefined,
      roleId: searchParams.get('roleId') || undefined,
      q: searchParams.get('q') || undefined,
    };
    const limit = parseInt(searchParams.get('limit') || '100');

    const users = await listUsers(session, filters, limit);
    return NextResponse.json({ users });
  } catch (error: any) {
    if (error?.message?.includes('cannot')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }
    console.error('Error listing users:', error);
    return NextResponse.json({ error: 'Failed to list users' }, { status: 500 });
  }
}

// ── POST /api/admin/users ───────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSessionUser(token);
    if (!session) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();

    // Basic validation
    if (!body.email || !body.displayName || !body.roleId || !body.password) {
      return NextResponse.json(
        { error: 'Email, nome, papel e senha são obrigatórios' },
        { status: 422 }
      );
    }

    if (body.password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter pelo menos 6 caracteres' },
        { status: 422 }
      );
    }

    const validRoles = ['administrator', 'coordinator', 'collaborator', 'internal_reader'];
    if (!validRoles.includes(body.roleId)) {
      return NextResponse.json(
        { error: 'Papel inválido' },
        { status: 422 }
      );
    }

    const user = await createUserFull(
      {
        email: body.email,
        displayName: body.displayName,
        roleId: body.roleId,
        password: body.password,
      },
      session
    );

    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    if (error?.message?.includes('cannot')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }
    if (error?.code === 'auth/email-already-exists') {
      return NextResponse.json({ error: 'Este email já está cadastrado' }, { status: 409 });
    }
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create user' },
      { status: 500 }
    );
  }
}
