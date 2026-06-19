// Comments Route Handler (T049)
// API endpoints for creating and managing task comments

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createComment, getTaskComments } from '@/src/domain/comments/comment-service';
import { getSessionUser } from '@/src/domain/auth/auth-service';
import { assertCan } from '@/src/domain/rbac/rbac-service';


/**
 * GET /api/tasks/[taskId]/comments
 * List all comments for a task
 */
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

    assertCan(session, 'view', 'task');

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

    assertCan(session, 'edit', 'task');

    const body = await request.json();
    if (!body.content || typeof body.content !== 'string' || body.content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment content is required' },
        { status: 400 }
      );
    }

    const comment = await createComment(taskId, body.content, session);

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    if ((error as any).message?.includes('permission')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}

/**
 * DELETE /api/tasks/[taskId]/comments/[commentId]
 * Delete a comment
 */

