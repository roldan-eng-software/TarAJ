import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getTask } from '@/src/domain/tasks/task-service';
import { getSessionUser } from '@/src/domain/auth/auth-service';
import { validateTransition } from '@/src/domain/workflow/workflow-service';
import { assertCanAccessTask } from '@/src/domain/rbac/rbac-service';
import { recordStageChange, recordTaskCompletion } from '@/src/domain/history/history-service';
import { logSuccess, logDenied } from '@/src/domain/audit/audit-service';
import { emitStageChangedAlert, emitTaskCompletedAlert } from '@/src/domain/notifications/notification-events';
import { adminDb } from '@/src/firebase/admin';
import type { StageId } from '@/src/types/domain';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params;
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const session = await getSessionUser(token);
  if (!session) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { targetStageId } = body;

    if (!targetStageId) {
      return NextResponse.json({ error: 'targetStageId is required' }, { status: 422 });
    }

    const task = await getTask(taskId);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    assertCanAccessTask(session, task, 'move');

    const validation = validateTransition(task.stageId, targetStageId);
    if (!validation.valid) {
      await logDenied(session.uid, session.roleId, 'move', 'task', taskId, {
        reason: validation.message || 'Invalid transition',
        fromStage: task.stageId,
        invalidTarget: targetStageId,
      });
      return NextResponse.json(
        { error: validation.message || 'Invalid transition' },
        { status: 409 }
      );
    }

    const previousStage = task.stageId;

    await adminDb.collection('tasks').doc(taskId).update({
      stageId: targetStageId,
      updatedAt: new Date(),
      updatedBy: session.uid,
      ...(targetStageId === 'concluida' ? { completedAt: new Date() } : {}),
    });

    await recordStageChange(taskId, session.uid, session.roleId, previousStage, targetStageId);

    await logSuccess(session.uid, session.roleId, 'move', 'task', taskId, {
      fromStage: previousStage,
      toStage: targetStageId,
    });

    const updatedTask = await getTask(taskId);
    if (updatedTask) {
      if (targetStageId === 'concluida') {
        await recordTaskCompletion(taskId, session.uid, session.roleId);
        await emitTaskCompletedAlert(updatedTask, session);
      } else {
        await emitStageChangedAlert(updatedTask, previousStage as StageId, targetStageId as StageId, session);
      }
    }

    return NextResponse.json({
      taskId: taskId,
      previousStageId: previousStage,
      stageId: targetStageId,
    });
  } catch (error: any) {
    console.error('Error transitioning task:', error);
    if (error?.message?.includes('cannot')) {
      await logDenied(session.uid, session.roleId, 'move', 'task', taskId, {
        reason: error.message,
      });
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to transition task' }, { status: 500 });
  }
}
