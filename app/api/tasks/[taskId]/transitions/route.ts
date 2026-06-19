// Transitions API Route Handler (T038)
// Execute workflow stage transitions with validation and side effects

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getTask } from '@/src/domain/tasks/task-service';
import { getSessionUser } from '@/src/domain/auth/auth-service';
import { assertCan } from '@/src/domain/rbac/rbac-service';
import { validateTransition } from '@/src/domain/workflow/workflow-service';
import { recordStageChange } from '@/src/domain/history/history-service';
import { logSuccess } from '@/src/domain/audit/audit-service';
import { emitStageChangedAlert, emitTaskCompletedAlert } from '@/src/domain/notifications/notification-events';
import { adminDb } from '@/src/firebase/admin';
import type { StageId } from '@/src/types/domain';

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

    assertCan(session, 'move', 'task');

    const task = await getTask(taskId);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (task.archived) {
      return NextResponse.json(
        { error: 'Cannot transition an archived task' },
        { status: 409 }
      );
    }

    const body = await request.json();
    const targetStageId = body.targetStageId as StageId;

    if (!targetStageId) {
      return NextResponse.json(
        { error: 'targetStageId is required' },
        { status: 422 }
      );
    }

    const validation = validateTransition(task.stageId, targetStageId);

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.message || 'Invalid transition' },
        { status: 409 }
      );
    }

    const now = new Date();
    const updates: Record<string, unknown> = {
      stageId: targetStageId,
      updatedAt: now,
      updatedBy: session.uid,
    };

    if (targetStageId === 'concluida') {
      updates.completedAt = now;
    }

    await adminDb.collection('tasks').doc(taskId).update(updates);

    await recordStageChange(
      taskId,
      session.uid,
      session.roleId,
      task.stageId,
      targetStageId,
      body.comment
    );

    await logSuccess(session.uid, session.roleId, 'move', 'task', taskId, {
      fromStage: task.stageId,
      toStage: targetStageId,
      backward: validation.backward,
    });

    await emitStageChangedAlert(
      task,
      task.stageId,
      targetStageId,
      session
    );

    if (targetStageId === 'concluida') {
      await emitTaskCompletedAlert(task, session);
    }

    return NextResponse.json({
      taskId,
      previousStageId: task.stageId,
      stageId: targetStageId,
      backward: validation.backward,
    });
  } catch (error: any) {
    console.error('Error transitioning task:', error);
    if (error?.message?.includes('cannot')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to transition task' }, { status: 500 });
  }
}
