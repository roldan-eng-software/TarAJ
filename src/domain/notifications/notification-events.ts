import { createAlert } from '@/src/domain/notifications/notification-service';
import { sendEmail } from '@/src/domain/notifications/email-sender';
import { queueEmail } from '@/src/domain/notifications/email-queue-service';
import { getRecipientsForEvent } from '@/src/domain/notifications/alert-config-service';
import { isBackwardTransition, getStageName } from '@/src/domain/workflow/workflow-service';
import { adminDb } from '@/src/firebase/admin';
import type { SessionUser, Task, StageId, AlertEventType } from '@/src/types/domain';

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

async function notifyRecipients(
  task: Task,
  eventType: AlertEventType,
  configStageId: StageId,
  message: string,
  emailSubject: string,
  emailBody: string,
  emailHtml: string,
  actor: SessionUser,
  metadata?: Record<string, unknown>
): Promise<void> {
  const recipients = await getRecipientsForEvent(configStageId, eventType, task);

  for (const { userId } of recipients) {
    await createAlert(
      eventType,
      task.id,
      userId,
      actor.displayName,
      message,
      { ...metadata, taskId: task.id }
    );

    const info = await resolveRecipientInfo(userId);
    if (info) {
      try {
        await sendEmail({
          to: info.email,
          subject: emailSubject,
          text: emailBody,
          html: emailHtml,
        });
      } catch {
        await queueEmail(
          info.email,
          info.displayName,
          emailSubject,
          emailBody,
          emailHtml,
          { ...metadata, taskId: task.id, eventType }
        );
      }
    }
  }
}

export async function emitTaskCreatedAlert(
  task: Task,
  actor: SessionUser
): Promise<void> {
  await notifyRecipients(
    task,
    'task_created',
    task.stageId,
    `Tarefa "${task.title}" foi criada por ${actor.displayName}`,
    `[TarAJ] Nova tarefa: ${task.title}`,
    `A tarefa "${task.title}" foi criada por ${actor.displayName}.`,
    `<p>A tarefa <strong>"${task.title}"</strong> foi criada por ${actor.displayName}.</p>`,
    actor,
    { createdBy: actor.uid }
  );
}

export async function emitResponsibleChangedAlert(
  task: Task,
  actor: SessionUser
): Promise<void> {
  await notifyRecipients(
    task,
    'responsible_changed',
    task.stageId,
    `Você foi designado responsável pela tarefa "${task.title}" por ${actor.displayName}`,
    `[TarAJ] Responsável alterado: ${task.title}`,
    `Você foi designado responsável pela tarefa "${task.title}" por ${actor.displayName}.`,
    `<p>Você foi designado responsável pela tarefa <strong>"${task.title}"</strong> por ${actor.displayName}.</p>`,
    actor,
    { changedBy: actor.uid }
  );
}

export async function emitStageChangedAlert(
  task: Task,
  fromStageId: StageId,
  toStageId: StageId,
  actor: SessionUser
): Promise<void> {
  const backward = isBackwardTransition(fromStageId, toStageId);
  const eventType: AlertEventType = backward ? 'stage_moved_backward' : 'stage_changed';
  const toStageName = getStageName(toStageId);
  const message = backward
    ? `Tarefa "${task.title}" retornou para "${toStageName}" por ${actor.displayName}`
    : `Tarefa "${task.title}" mudou para "${toStageName}" por ${actor.displayName}`;

  await notifyRecipients(
    task,
    eventType,
    toStageId,
    message,
    `[TarAJ] Estágio alterado: ${task.title}`,
    `${message} por ${actor.displayName}.`,
    `<p>${message} por ${actor.displayName}.</p>`,
    actor,
    { fromStage: fromStageId, toStage: toStageId }
  );
}

export async function emitMentionAlert(
  task: Task,
  mentionedUserId: string,
  actor: SessionUser
): Promise<void> {
  await notifyRecipients(
    task,
    'mentioned_in_comment',
    task.stageId,
    `Você foi mencionado por ${actor.displayName} na tarefa "${task.title}"`,
    `[TarAJ] Menção: ${task.title}`,
    `Você foi mencionado por ${actor.displayName} na tarefa "${task.title}".`,
    `<p>Você foi mencionado por ${actor.displayName} na tarefa <strong>"${task.title}"</strong>.</p>`,
    actor,
    { mentionedBy: actor.uid }
  );
}

export async function emitTaskCompletedAlert(
  task: Task,
  actor: SessionUser
): Promise<void> {
  await notifyRecipients(
    task,
    'task_completed',
    'concluida',
    `Tarefa "${task.title}" foi concluída por ${actor.displayName}`,
    `[TarAJ] Tarefa concluída: ${task.title}`,
    `A tarefa "${task.title}" foi concluída por ${actor.displayName}.`,
    `<p>A tarefa <strong>"${task.title}"</strong> foi concluída por ${actor.displayName}.</p>`,
    actor,
    { completedBy: actor.uid }
  );
}

export async function emitTaskArchivedAlert(
  task: Task,
  actor: SessionUser
): Promise<void> {
  await notifyRecipients(
    task,
    'task_archived',
    'arquivada',
    `Tarefa "${task.title}" foi arquivada por ${actor.displayName}`,
    `[TarAJ] Tarefa arquivada: ${task.title}`,
    `A tarefa "${task.title}" foi arquivada por ${actor.displayName}.`,
    `<p>A tarefa <strong>"${task.title}"</strong> foi arquivada por ${actor.displayName}.</p>`,
    actor,
    { archivedBy: actor.uid }
  );
}

export async function emitTaskRestoredAlert(
  task: Task,
  actor: SessionUser,
  targetStageId: StageId
): Promise<void> {
  await notifyRecipients(
    task,
    'task_restored',
    targetStageId,
    `Tarefa "${task.title}" foi restaurada por ${actor.displayName}`,
    `[TarAJ] Tarefa restaurada: ${task.title}`,
    `A tarefa "${task.title}" foi restaurada por ${actor.displayName}.`,
    `<p>A tarefa <strong>"${task.title}"</strong> foi restaurada por ${actor.displayName}.</p>`,
    actor,
    { restoredBy: actor.uid, targetStage: targetStageId }
  );
}
