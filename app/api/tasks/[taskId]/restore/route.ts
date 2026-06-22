import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getTask } from '@/src/domain/tasks/task-service';
import { getSessionFromRequest } from '@/src/lib/session';
import { assertCan } from '@/src/domain/rbac/rbac-service';
import { adminDb } from '@/src/firebase/admin';
import { onTaskRestored } from '@/src/domain/workflow/archive-events';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    assertCan(session, 'restore', 'task');

    const task = await getTask(taskId);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (!task.archived) {
      return NextResponse.json({ error: 'Task is not archived' }, { status: 409 });
    }

    const body = await request.json();
    const targetStageId: string = body.stageId || 'entrada';

    const now = new Date();
    await adminDb.collection('tasks').doc(taskId).update({
      archived: false,
      stageId: targetStageId,
      archivedAt: null,
      updatedAt: now,
      updatedBy: session.uid,
    });

    const updatedTask = await getTask(taskId);
    if (updatedTask) {
      await onTaskRestored(updatedTask, session, targetStageId);
    }

    return NextResponse.json(updatedTask);
  } catch (error: any) {
    console.error('Error restoring task:', error);
    if (error?.message?.includes('cannot')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to restore task' }, { status: 500 });
  }
}
