import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { deleteComment } from '@/src/domain/comments/comment-service';
import { getSessionFromRequest } from '@/src/lib/session';
import { assertCan } from '@/src/domain/rbac/rbac-service';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string; commentId: string }> }
) {
  try {
    const { taskId, commentId } = await params;
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    assertCan(session, 'delete', 'comment');

    await deleteComment(taskId, commentId, session);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
}
