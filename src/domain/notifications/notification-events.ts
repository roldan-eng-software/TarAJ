import { createAlert } from '@/src/domain/notifications/notification-service';
import { queueEmail } from '@/src/domain/notifications/email-queue-service';
import { adminDb } from '@/src/firebase/admin';
import type { SessionUser } from '@/src/types/domain';

async function resolveEmail(userId: string): Promise<string | null> {
  try {
    const doc = await adminDb.collection('users').doc(userId).get();
    if (!doc.exists) return null;
    return doc.data()?.email || null;
  } catch {
    return null;
  }
}

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

  const email = await resolveEmail(responsibleUserId);
  if (email) {
    await queueEmail(
      email,
      '',
      `[TarAJ] Nova tarefa: ${taskTitle}`,
      `A tarefa "${taskTitle}" foi criada por ${actor.displayName}.`,
      `<p>A tarefa <strong>"${taskTitle}"</strong> foi criada por ${actor.displayName}.</p>`,
      { taskId, eventType: 'task_created' }
    );
  }
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

  const email = await resolveEmail(newResponsibleId);
  if (email) {
    await queueEmail(
      email,
      '',
      `[TarAJ] Responsável alterado: ${taskTitle}`,
      `Você foi designado responsável pela tarefa "${taskTitle}" por ${actor.displayName}.`,
      `<p>Você foi designado responsável pela tarefa <strong>"${taskTitle}"</strong> por ${actor.displayName}.</p>`,
      { taskId, eventType: 'responsible_changed' }
    );
  }
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

  const email = await resolveEmail(responsibleUserId);
  if (email) {
    await queueEmail(
      email,
      '',
      `[TarAJ] Estágio alterado: ${taskTitle}`,
      `${message} por ${actor.displayName}.`,
      `<p>${message} por ${actor.displayName}.</p>`,
      { taskId, fromStage, toStage, eventType }
    );
  }
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

  const email = await resolveEmail(mentionedUserId);
  if (email) {
    await queueEmail(
      email,
      '',
      `[TarAJ] Menção: ${taskTitle}`,
      `Você foi mencionado por ${actor.displayName} na tarefa "${taskTitle}".`,
      `<p>Você foi mencionado por ${actor.displayName} na tarefa <strong>"${taskTitle}"</strong>.</p>`,
      { taskId, eventType: 'mentioned_in_comment' }
    );
  }
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

  const email = await resolveEmail(responsibleUserId);
  if (email) {
    await queueEmail(
      email,
      '',
      `[TarAJ] Tarefa concluída: ${taskTitle}`,
      `A tarefa "${taskTitle}" foi concluída por ${actor.displayName}.`,
      `<p>A tarefa <strong>"${taskTitle}"</strong> foi concluída por ${actor.displayName}.</p>`,
      { taskId, eventType: 'task_completed' }
    );
  }
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

  const email = await resolveEmail(responsibleUserId);
  if (email) {
    await queueEmail(
      email,
      '',
      `[TarAJ] Tarefa arquivada: ${taskTitle}`,
      `A tarefa "${taskTitle}" foi arquivada por ${actor.displayName}.`,
      `<p>A tarefa <strong>"${taskTitle}"</strong> foi arquivada por ${actor.displayName}.</p>`,
      { taskId, eventType: 'task_archived' }
    );
  }
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

  const email = await resolveEmail(responsibleUserId);
  if (email) {
    await queueEmail(
      email,
      '',
      `[TarAJ] Tarefa restaurada: ${taskTitle}`,
      `A tarefa "${taskTitle}" foi restaurada por ${actor.displayName}.`,
      `<p>A tarefa <strong>"${taskTitle}"</strong> foi restaurada por ${actor.displayName}.</p>`,
      { taskId, eventType: 'task_restored' }
    );
  }
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
