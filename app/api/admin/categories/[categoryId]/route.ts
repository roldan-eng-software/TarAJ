import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/src/lib/session';
import { updateCategory, deleteCategory } from '@/src/domain/categories/category-service';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const { categoryId } = await params;

    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.roleId !== 'administrator') {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const body = await request.json();
    const updates: { name?: string; order?: number; active?: boolean } = {};

    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim().length < 2) {
        return NextResponse.json({ error: 'Name must be at least 2 characters' }, { status: 422 });
      }
      updates.name = body.name.trim();
    }

    if (body.order !== undefined) {
      if (typeof body.order !== 'number' || body.order < 0) {
        return NextResponse.json({ error: 'Order must be a non-negative number' }, { status: 422 });
      }
      updates.order = body.order;
    }

    if (body.active !== undefined) {
      if (typeof body.active !== 'boolean') {
        return NextResponse.json({ error: 'Active must be a boolean' }, { status: 422 });
      }
      updates.active = body.active;
    }

    await updateCategory(categoryId, updates, session.uid);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const { categoryId } = await params;

    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.roleId !== 'administrator') {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    await deleteCategory(categoryId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
