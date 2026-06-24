import { adminDb } from '@/src/firebase/admin';
import { createAlert } from '@/src/domain/notifications/notification-service';
import { sendEmail } from '@/src/domain/notifications/email-sender';
import { queueEmail } from '@/src/domain/notifications/email-queue-service';
import { sendWhatsAppNotification } from '@/src/domain/notifications/whatsapp-sender';
import { getRecipientsForEvent } from '@/src/domain/notifications/alert-config-service';
import { inactivityAlertTemplate } from '@/src/domain/notifications/email-templates';
import { whatsappInactivityAlertTemplate } from '@/src/domain/notifications/whatsapp-templates';
import { getInactivityConfig } from '@/src/domain/notifications/inactivity-config';
import type { Task, StageId } from '@/src/types/domain';

export async function getInactiveTasks(daysThreshold: number): Promise<Task[]> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysThreshold);

  const snapshot = await adminDb
    .collection('tasks')
    .where('archived', '==', false)
    .where('lastActivityAt', '<', cutoff)
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() ?? data.createdAt,
      updatedAt: data.updatedAt?.toDate?.() ?? data.updatedAt,
      dueDate: data.dueDate?.toDate?.() ?? data.dueDate,
      lastActivityAt: data.lastActivityAt?.toDate?.() ?? data.lastActivityAt,
      completedAt: data.completedAt?.toDate?.() ?? data.completedAt,
      archivedAt: data.archivedAt?.toDate?.() ?? data.archivedAt,
    } as Task;
  });
}

async function getRecipientInfo(
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

function buildInactivityMessage(taskTitle: string, daysInactive: number): string {
  return `Tarefa "${taskTitle}" está sem movimentação há ${daysInactive} dias`;
}

async function notifyRecipient(
  userId: string,
  taskId: string,
  message: string,
  emailSubject: string,
  emailBody: string,
  emailHtml: string,
  metadata: Record<string, unknown>,
  whatsappMessage?: string
): Promise<void> {
  await createAlert('inactivity_alert', taskId, userId, 'Sistema', message, metadata);

  const info = await getRecipientInfo(userId);
  if (info) {
    try {
      await sendEmail({
        to: info.email,
        subject: emailSubject,
        text: emailBody,
        html: emailHtml,
      });
    } catch {
      await queueEmail(info.email, info.displayName, emailSubject, emailBody, emailHtml, {
        ...metadata,
        taskId,
        eventType: 'inactivity_alert',
      });
    }

    if (whatsappMessage) {
      await sendWhatsAppNotification(userId, whatsappMessage, { ...metadata, taskId, eventType: 'inactivity_alert' });
    }
  }
}

export async function alertInactiveTasks(daysThreshold: number): Promise<number> {
  const tasks = await getInactiveTasks(daysThreshold);
  let alertCount = 0;

  for (const task of tasks) {
    const lastActivity = task.lastActivityAt || task.updatedAt;
    const daysInactive = Math.ceil(
      (new Date().getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
    );

    const message = buildInactivityMessage(task.title, daysInactive);
    const recipients = await getRecipientsForEvent(
      task.stageId as StageId,
      'inactivity_alert',
      task
    );

    for (const { userId } of recipients) {
      const tpl = inactivityAlertTemplate({
        taskTitle: task.title,
        actorName: 'Sistema',
        taskId: task.id,
        daysInactive,
      });
      const whatsappMsg = whatsappInactivityAlertTemplate({
        taskTitle: task.title,
        actorName: 'Sistema',
        taskId: task.id,
        daysInactive,
      });
      await notifyRecipient(
        userId,
        task.id,
        message,
        tpl.subject,
        tpl.text,
        tpl.html,
        { taskId: task.id, daysInactive },
        whatsappMsg
      );
      alertCount++;
    }
  }

  return alertCount;
}

export async function runInactivityCheck(): Promise<{ checked: number; alerts: number }> {
  const config = await getInactivityConfig();

  if (!config.enabled) {
    return { checked: 0, alerts: 0 };
  }

  const tasks = await getInactiveTasks(config.daysThreshold);
  const alerts = await alertInactiveTasks(config.daysThreshold);
  return { checked: tasks.length, alerts };
}
