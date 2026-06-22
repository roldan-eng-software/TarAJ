import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSessionUser } from '@/src/domain/auth/auth-service';
import { getAllCategories, createCategory } from '@/src/domain/categories/category-service';

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

    if (session.roleId !== 'administrator') {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const categories = await getAllCategories();
    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

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

    if (session.roleId !== 'administrator') {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const body = await request.json();
    const { name, order } = body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ error: 'Name is required (min 2 characters)' }, { status: 422 });
    }

    if (typeof order !== 'number' || order < 0) {
      return NextResponse.json({ error: 'Order must be a non-negative number' }, { status: 422 });
    }

    const category = await createCategory({ name: name.trim(), order }, session.uid);
    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
