// Archive/Restore Route Handlers (T067)
// API endpoints for archiving and restoring tasks

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getTask } from '@/src/domain/tasks/task-service';
import { getSessionUser } from '@/src/domain/auth/auth-service';
import { assertCan } from '@/src/domain/rbac/rbac-service';
import { onTaskArchived, onTaskRestored } from '@/src/domain/workflow/archive-events';
import { adminDb } from '@/src/firebase/admin';

/**
 * POST /api/tasks/[taskId]/archive
 * Archive a completed task
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSessionUser(token);
    if (!session) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    assertCan(session, 'edit', 'task');

    const task = await getTask(params.taskId);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Only allow archiving completed tasks
    if (task.stageId !== 'concluida') {
      return NextResponse.json(
        { error: 'Only completed tasks can be archived' },
        { status: 400 }
      );
    }

    const now = new Date();

    // Update task
    await adminDb.collection('tasks').doc(params.taskId).update({
      archived: true,
      archivedAt: now,
      archivedBy: session.uid,
      updatedAt: now,
      updatedBy: session.uid,
    });

    // Record history, audit and alerts
    await onTaskArchived(task, session);

    const updated = await getTask(params.taskId);
    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('Error archiving task:', error);
    if ((error as any).message?.includes('permission')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to archive task' }, { status: 500 });
  }
}

/**
 * PUT /api/tasks/[taskId]/restore
 * Restore an archived task
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSessionUser(token);
    if (!session) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    assertCan(session, 'edit', 'task');

    const task = await getTask(params.taskId);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Only allow restoring archived tasks
    if (!task.archived) {
      return NextResponse.json({ error: 'Task is not archived' }, { status: 400 });
    }

    const now = new Date();

    // Restore to previous stage or default to entrada
    const body = await request.json();
    const targetStage = body.stageId || 'entrada';

    await adminDb.collection('tasks').doc(params.taskId).update({
      archived: false,
      stageId: targetStage,
      archivedAt: null,
      archivedBy: null,
      updatedAt: now,
      updatedBy: session.uid,
    });

    // Record history, audit and alerts
    await onTaskRestored(task, session, targetStage);

    const updated = await getTask(params.taskId);
    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('Error restoring task:', error);
    if ((error as any).message?.includes('permission')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to restore task' }, { status: 500 });
  }
}
