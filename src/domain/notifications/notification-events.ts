import { createAlert } from '@/src/domain/notifications/notification-service';
import { queueEmail } from '@/src/domain/notifications/email-queue-service';
import { isBackwardTransition, getStageName } from '@/src/domain/workflow/workflow-service';
import { adminDb } from '@/src/firebase/admin';
import type { SessionUser, StageId } from '@/src/types/domain';

async function resolveRecipientInfo(
  userId: string
): Promise<{ email: string; displayName: string } | null> {
  try {
    const doc = await adminDb.collection('users').doc(userId).get();
    if (!doc.exists) return null;
    const data = doc.data();
    if (!data?.email) return null;
    return { email: data.email, displayName: data.displayName || '' };
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

  const recipient = await resolveRecipientInfo(responsibleUserId);
  if (recipient) {
    await queueEmail(
      recipient.email,
      recipient.displayName,
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

  const recipient = await resolveRecipientInfo(newResponsibleId);
  if (recipient) {
    await queueEmail(
      recipient.email,
      recipient.displayName,
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
  fromStageId: StageId,
  toStageId: StageId,
  responsibleUserId: string,
  actor: SessionUser
): Promise<void> {
  const backward = isBackwardTransition(fromStageId, toStageId);
  const eventType = backward ? 'stage_moved_backward' : 'stage_changed';
  const toStageName = getStageName(toStageId);
  const message = backward
    ? `Tarefa "${taskTitle}" retornou para "${toStageName}"`
    : `Tarefa "${taskTitle}" mudou para "${toStageName}"`;

  await createAlert(
    eventType,
    taskId,
    responsibleUserId,
    actor.displayName,
    message,
    { taskId, fromStage: fromStageId, toStage: toStageId }
  );

  const recipient = await resolveRecipientInfo(responsibleUserId);
  if (recipient) {
    await queueEmail(
      recipient.email,
      recipient.displayName,
      `[TarAJ] Estágio alterado: ${taskTitle}`,
      `${message} por ${actor.displayName}.`,
      `<p>${message} por ${actor.displayName}.</p>`,
      { taskId, fromStage: fromStageId, toStage: toStageId, eventType }
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

  const recipient = await resolveRecipientInfo(mentionedUserId);
  if (recipient) {
    await queueEmail(
      recipient.email,
      recipient.displayName,
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

  const recipient = await resolveRecipientInfo(responsibleUserId);
  if (recipient) {
    await queueEmail(
      recipient.email,
      recipient.displayName,
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

  const recipient = await resolveRecipientInfo(responsibleUserId);
  if (recipient) {
    await queueEmail(
      recipient.email,
      recipient.displayName,
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

  const recipient = await resolveRecipientInfo(responsibleUserId);
  if (recipient) {
    await queueEmail(
      recipient.email,
      recipient.displayName,
      `[TarAJ] Tarefa restaurada: ${taskTitle}`,
      `A tarefa "${taskTitle}" foi restaurada por ${actor.displayName}.`,
      `<p>A tarefa <strong>"${taskTitle}"</strong> foi restaurada por ${actor.displayName}.</p>`,
      { taskId, eventType: 'task_restored' }
    );
  }
}
