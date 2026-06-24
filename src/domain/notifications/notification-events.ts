import { createAlert } from '@/src/domain/notifications/notification-service';
import { sendEmail } from '@/src/domain/notifications/email-sender';
import { queueEmail } from '@/src/domain/notifications/email-queue-service';
import { getRecipientsForEvent } from '@/src/domain/notifications/alert-config-service';
import { isBackwardTransition, getStageName } from '@/src/domain/workflow/workflow-service';
import { adminDb } from '@/src/firebase/admin';
import type { SessionUser, Task, StageId, AlertEventType } from '@/src/types/domain';
import {
  taskCreatedTemplate, taskAssignedTemplate, stageChangedTemplate,
  mentionTemplate, completedTemplate, archivedTemplate, restoredTemplate,
} from '@/src/domain/notifications/email-templates';

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
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error(`[sendEmail] SMTP error for ${info.email}: ${errorMessage}`, { taskId: task.id, eventType });
        await queueEmail(
          info.email,
          info.displayName,
          emailSubject,
          emailBody,
          emailHtml,
          { ...metadata, taskId: task.id, eventType, smtpError: errorMessage }
        );
      }
    }
  }
}

export async function emitTaskCreatedAlert(
  task: Task,
  actor: SessionUser
): Promise<void> {
  const tpl = taskCreatedTemplate({ taskTitle: task.title, actorName: actor.displayName, taskId: task.id });
  await notifyRecipients(
    task,
    'task_created',
    task.stageId,
    `Tarefa "${task.title}" foi criada por ${actor.displayName}`,
    tpl.subject,
    tpl.text,
    tpl.html,
    actor,
    { createdBy: actor.uid }
  );
}

export async function emitResponsibleChangedAlert(
  task: Task,
  actor: SessionUser
): Promise<void> {
  const tpl = taskAssignedTemplate({ taskTitle: task.title, actorName: actor.displayName, taskId: task.id });
  await notifyRecipients(
    task,
    'responsible_changed',
    task.stageId,
    `Você foi designado responsável pela tarefa "${task.title}" por ${actor.displayName}`,
    tpl.subject,
    tpl.text,
    tpl.html,
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
  const fromStageName = getStageName(fromStageId);
  const message = backward
    ? `Tarefa "${task.title}" retornou para "${toStageName}" por ${actor.displayName}`
    : `Tarefa "${task.title}" mudou para "${toStageName}" por ${actor.displayName}`;

  const tpl = stageChangedTemplate({
    taskTitle: task.title, actorName: actor.displayName, taskId: task.id,
    fromStage: fromStageName, toStage: toStageName, backward,
  });

  await notifyRecipients(
    task,
    eventType,
    toStageId,
    message,
    tpl.subject,
    tpl.text,
    tpl.html,
    actor,
    { fromStage: fromStageId, toStage: toStageId }
  );
}

export async function emitMentionAlert(
  task: Task,
  mentionedUserId: string,
  actor: SessionUser
): Promise<void> {
  const tpl = mentionTemplate({ taskTitle: task.title, actorName: actor.displayName, taskId: task.id });
  await notifyRecipients(
    task,
    'mentioned_in_comment',
    task.stageId,
    `Você foi mencionado por ${actor.displayName} na tarefa "${task.title}"`,
    tpl.subject,
    tpl.text,
    tpl.html,
    actor,
    { mentionedBy: actor.uid }
  );
}

export async function emitTaskCompletedAlert(
  task: Task,
  actor: SessionUser
): Promise<void> {
  const tpl = completedTemplate({ taskTitle: task.title, actorName: actor.displayName, taskId: task.id });
  await notifyRecipients(
    task,
    'task_completed',
    'concluida',
    `Tarefa "${task.title}" foi concluída por ${actor.displayName}`,
    tpl.subject,
    tpl.text,
    tpl.html,
    actor,
    { completedBy: actor.uid }
  );
}

export async function emitTaskArchivedAlert(
  task: Task,
  actor: SessionUser
): Promise<void> {
  const tpl = archivedTemplate({ taskTitle: task.title, actorName: actor.displayName, taskId: task.id });
  await notifyRecipients(
    task,
    'task_archived',
    'arquivada',
    `Tarefa "${task.title}" foi arquivada por ${actor.displayName}`,
    tpl.subject,
    tpl.text,
    tpl.html,
    actor,
    { archivedBy: actor.uid }
  );
}

export async function emitTaskRestoredAlert(
  task: Task,
  actor: SessionUser,
  targetStageId: StageId
): Promise<void> {
  const tpl = restoredTemplate({ taskTitle: task.title, actorName: actor.displayName, taskId: task.id, targetStage: getStageName(targetStageId) });
  await notifyRecipients(
    task,
    'task_restored',
    targetStageId,
    `Tarefa "${task.title}" foi restaurada por ${actor.displayName}`,
    tpl.subject,
    tpl.text,
    tpl.html,
    actor,
    { restoredBy: actor.uid, targetStage: targetStageId }
  );
}
