import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createComment, getTaskComments } from '@/src/domain/comments/comment-service';
import { getSessionUser } from '@/src/domain/auth/auth-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSessionUser(token);
    if (!session) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const comments = await getTaskComments(taskId);
    return NextResponse.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSessionUser(token);
    if (!session) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    if (!body.content || !body.content.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 422 });
    }

    const comment = await createComment(taskId, body.content, session);
    return NextResponse.json(comment, { status: 201 });
  } catch (error: any) {
    console.error('Error creating comment:', error);
    if (error?.message?.includes('cannot')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}
