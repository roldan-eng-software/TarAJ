import { createAlert } from '@/src/domain/notifications/notification-service';
import type { SessionUser } from '@/src/types/domain';

export async function emitTaskCreatedAlert(
  taskId: string,
  taskTitle: string,
  responsibleUserId: string,
  actor: SessionUser
): Promise<void> {
  await createAlert(
    'task_created',
    taskId,
    responsibleUserId,
    actor.displayName,
    `Tarefa "${taskTitle}" foi criada`,
    { taskId, createdBy: actor.uid }
  );
}

export async function emitResponsibleChangedAlert(
  taskId: string,
  taskTitle: string,
  newResponsibleId: string,
  actor: SessionUser
): Promise<void> {
  await createAlert(
    'responsible_changed',
    taskId,
    newResponsibleId,
    actor.displayName,
    `Você foi designado responsável pela tarefa "${taskTitle}"`,
    { taskId, changedBy: actor.uid }
  );
}

export async function emitStageChangedAlert(
  taskId: string,
  taskTitle: string,
  fromStage: string,
  toStage: string,
  responsibleUserId: string,
  actor: SessionUser
): Promise<void> {
  const eventType = isBackwardTransition(fromStage, toStage) ? 'stage_moved_backward' : 'stage_changed';
  const message = isBackwardTransition(fromStage, toStage)
    ? `Tarefa "${taskTitle}" retornou para "${toStage}"`
    : `Tarefa "${taskTitle}" mudou para "${toStage}"`;

  await createAlert(
    eventType,
    taskId,
    responsibleUserId,
    actor.displayName,
    message,
    { taskId, fromStage, toStage }
  );
}

export async function emitMentionAlert(
  taskId: string,
  taskTitle: string,
  mentionedUserId: string,
  actor: SessionUser
): Promise<void> {
  await createAlert(
    'mentioned_in_comment',
    taskId,
    mentionedUserId,
    actor.displayName,
    `Você foi mencionado na tarefa "${taskTitle}"`,
    { taskId, mentionedBy: actor.uid }
  );
}

export async function emitTaskCompletedAlert(
  taskId: string,
  taskTitle: string,
  responsibleUserId: string,
  actor: SessionUser
): Promise<void> {
  await createAlert(
    'task_completed',
    taskId,
    responsibleUserId,
    actor.displayName,
    `Tarefa "${taskTitle}" foi concluída`,
    { taskId, completedBy: actor.uid }
  );
}

export async function emitTaskArchivedAlert(
  taskId: string,
  taskTitle: string,
  responsibleUserId: string,
  actor: SessionUser
): Promise<void> {
  await createAlert(
    'task_archived',
    taskId,
    responsibleUserId,
    actor.displayName,
    `Tarefa "${taskTitle}" foi arquivada`,
    { taskId, archivedBy: actor.uid }
  );
}

export async function emitTaskRestoredAlert(
  taskId: string,
  taskTitle: string,
  responsibleUserId: string,
  actor: SessionUser
): Promise<void> {
  await createAlert(
    'task_restored',
    taskId,
    responsibleUserId,
    actor.displayName,
    `Tarefa "${taskTitle}" foi restaurada`,
    { taskId, restoredBy: actor.uid }
  );
}

function isBackwardTransition(fromStage: string, toStage: string): boolean {
  const stageOrder: Record<string, number> = {
    entrada: 0,
    analise: 1,
    aguardando_docs: 2,
    andamento: 3,
    revisao: 4,
    concluida: 5,
    arquivada: 6,
  };

  const from = stageOrder[fromStage];
  const to = stageOrder[toStage];

  if (from === undefined || to === undefined) return false;
  return to < from;
}
