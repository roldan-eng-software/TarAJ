import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getTask } from '@/src/domain/tasks/task-service';
import { getSessionUser } from '@/src/domain/auth/auth-service';
import { assertCan } from '@/src/domain/rbac/rbac-service';
import { onTaskRestored } from '@/src/domain/workflow/archive-events';
import { adminDb } from '@/src/firebase/admin';

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

    const task = await getTask(taskId);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (!task.archived) {
      return NextResponse.json({ error: 'Task is not archived' }, { status: 400 });
    }

    const now = new Date();
    const body = await request.json();
    const targetStage = body.stageId || 'entrada';

    await adminDb.collection('tasks').doc(taskId).update({
      archived: false,
      stageId: targetStage,
      archivedAt: null,
      archivedBy: null,
      updatedAt: now,
      updatedBy: session.uid,
    });

    await onTaskRestored(task, session, targetStage);

    const updated = await getTask(taskId);
    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('Error restoring task:', error);
    if ((error as any).message?.includes('permission')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to restore task' }, { status: 500 });
  }
}
