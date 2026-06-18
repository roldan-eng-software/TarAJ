import { recordHistoryEvent } from '@/src/domain/history/history-service';
import { logAudit } from '@/src/domain/audit/audit-service';
import { emitTaskArchivedAlert, emitTaskRestoredAlert } from '@/src/domain/notifications/notification-events';
import type { SessionUser, Task } from '@/src/types/domain';

export async function onTaskArchived(
  task: Task,
  actor: SessionUser
): Promise<void> {
  await recordHistoryEvent(task.id, 'archived', actor.uid, actor.roleId, {
    archivedBy: actor.displayName,
    previousStage: task.stageId,
  });

  await logAudit(
    actor.uid,
    actor.roleId,
    'archive',
    'task',
    task.id,
    'success',
    { previousStage: task.stageId, archivedAt: new Date().toISOString() }
  );

  await emitTaskArchivedAlert(task.id, task.title, task.responsibleUserId, actor);
}

export async function onTaskRestored(
  task: Task,
  actor: SessionUser,
  targetStage: string
): Promise<void> {
  await recordHistoryEvent(task.id, 'restored', actor.uid, actor.roleId, {
    restoredBy: actor.displayName,
    targetStage,
  });

  await logAudit(
    actor.uid,
    actor.roleId,
    'restore',
    'task',
    task.id,
    'success',
    { targetStage, restoredAt: new Date().toISOString() }
  );

  await emitTaskRestoredAlert(task.id, task.title, task.responsibleUserId, actor);
}
