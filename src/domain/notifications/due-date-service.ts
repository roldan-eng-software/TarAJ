import { adminDb } from '@/src/firebase/admin';
import { createAlert } from '@/src/domain/notifications/notification-service';
import { sendEmail } from '@/src/domain/notifications/email-sender';
import { queueEmail } from '@/src/domain/notifications/email-queue-service';
import { sendWhatsAppNotification } from '@/src/domain/notifications/whatsapp-sender';
import { getRecipientsForEvent } from '@/src/domain/notifications/alert-config-service';
import { dueDateUpcomingTemplate, dueDateOverdueTemplate } from '@/src/domain/notifications/email-templates';
import { whatsappDueDateUpcomingTemplate, whatsappDueDateOverdueTemplate } from '@/src/domain/notifications/whatsapp-templates';
import type { Task, StageId } from '@/src/types/domain';

export async function getUpcomingDueTasks(daysAhead: number = 3): Promise<Task[]> {
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  const snapshot = await adminDb
    .collection('tasks')
    .where('archived', '==', false)
    .where('dueDate', '>=', now)
    .where('dueDate', '<=', futureDate)
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt.toDate(),
    updatedAt: doc.data().updatedAt.toDate(),
    dueDate: doc.data().dueDate?.toDate(),
  })) as Task[];
}

export async function getOverdueTasks(): Promise<Task[]> {
  const now = new Date();

  const snapshot = await adminDb
    .collection('tasks')
    .where('archived', '==', false)
    .where('dueDate', '<', now)
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt.toDate(),
    updatedAt: doc.data().updatedAt.toDate(),
    dueDate: doc.data().dueDate?.toDate(),
  })) as Task[];
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

function buildAlertMessage(taskTitle: string, daysUntilDue: number): string {
  if (daysUntilDue === 1) {
    return `Tarefa "${taskTitle}" vence amanhã`;
  }
  return `Tarefa "${taskTitle}" vence em ${daysUntilDue} dias`;
}

function buildOverdueMessage(taskTitle: string, daysSinceDue: number): string {
  return `Tarefa "${taskTitle}" está vencida há ${daysSinceDue} dias`;
}

async function notifyRecipient(
  userId: string,
  eventType: 'due_upcoming' | 'due_overdue',
  taskId: string,
  message: string,
  emailSubject: string,
  emailBody: string,
  emailHtml: string,
  metadata: Record<string, unknown>,
  whatsappMessage?: string
): Promise<void> {
  await createAlert(eventType, taskId, userId, 'Sistema', message, metadata);

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
        eventType,
      });
    }

    if (whatsappMessage) {
      await sendWhatsAppNotification(userId, whatsappMessage, { ...metadata, taskId, eventType });
    }
  }
}

export async function alertUpcomingDueTasks(daysAhead: number = 3): Promise<number> {
  const tasks = await getUpcomingDueTasks(daysAhead);
  let alertCount = 0;

  for (const task of tasks) {
    if (!task.dueDate) continue;

    const daysUntilDue = Math.ceil(
      (task.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilDue < 1 || daysUntilDue > daysAhead) continue;

    const message = buildAlertMessage(task.title, daysUntilDue);
    const recipients = await getRecipientsForEvent(
      task.stageId as StageId,
      'due_upcoming',
      task
    );

    for (const { userId } of recipients) {
      const tpl = dueDateUpcomingTemplate({ taskTitle: task.title, actorName: 'Sistema', taskId: task.id, dueDate: task.dueDate.toISOString().split('T')[0] });
      const whatsappMsg = whatsappDueDateUpcomingTemplate({ taskTitle: task.title, actorName: 'Sistema', taskId: task.id, dueDate: task.dueDate.toISOString().split('T')[0] });
      await notifyRecipient(
        userId,
        'due_upcoming',
        task.id,
        message,
        tpl.subject,
        tpl.text,
        tpl.html,
        { taskId: task.id, daysUntil: daysUntilDue },
        whatsappMsg
      );
      alertCount++;
    }
  }

  return alertCount;
}

export async function alertOverdueTasks(): Promise<number> {
  const tasks = await getOverdueTasks();
  let alertCount = 0;

  for (const task of tasks) {
    if (!task.dueDate) continue;

    const daysSinceDue = Math.ceil(
      (new Date().getTime() - task.dueDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const message = buildOverdueMessage(task.title, daysSinceDue);
    const recipients = await getRecipientsForEvent(
      task.stageId as StageId,
      'due_overdue',
      task
    );

    for (const { userId } of recipients) {
      const tpl = dueDateOverdueTemplate({ taskTitle: task.title, actorName: 'Sistema', taskId: task.id, dueDate: task.dueDate.toISOString().split('T')[0] });
      const whatsappMsg = whatsappDueDateOverdueTemplate({ taskTitle: task.title, actorName: 'Sistema', taskId: task.id, dueDate: task.dueDate.toISOString().split('T')[0] });
      await notifyRecipient(
        userId,
        'due_overdue',
        task.id,
        message,
        tpl.subject,
        tpl.text,
        tpl.html,
        { taskId: task.id, daysSinceDue },
        whatsappMsg
      );
      alertCount++;
    }
  }

  return alertCount;
}

export async function runDueDateCheck(): Promise<{ upcoming: number; overdue: number }> {
  const upcoming = await alertUpcomingDueTasks(3);
  const overdue = await alertOverdueTasks();
  return { upcoming, overdue };
}
