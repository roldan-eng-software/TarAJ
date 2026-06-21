import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getTask } from '@/src/domain/tasks/task-service';
import { getSessionUser } from '@/src/domain/auth/auth-service';
import { assertCan } from '@/src/domain/rbac/rbac-service';
import { adminDb } from '@/src/firebase/admin';
import { onTaskArchived } from '@/src/domain/workflow/archive-events';

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

    assertCan(session, 'archive', 'task');

    const task = await getTask(taskId);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (task.archived) {
      return NextResponse.json({ error: 'Task is already archived' }, { status: 409 });
    }

    if (task.stageId !== 'concluida') {
      return NextResponse.json({ error: 'Only completed tasks can be archived' }, { status: 409 });
    }

    const now = new Date();
    await adminDb.collection('tasks').doc(taskId).update({
      archived: true,
      stageId: 'arquivada',
      archivedAt: now,
      updatedAt: now,
      updatedBy: session.uid,
    });

    const updatedTask = await getTask(taskId);
    if (updatedTask) {
      await onTaskArchived(updatedTask, session);
    }

    return NextResponse.json(updatedTask);
  } catch (error: any) {
    console.error('Error archiving task:', error);
    if (error?.message?.includes('cannot')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to archive task' }, { status: 500 });
  }
}
