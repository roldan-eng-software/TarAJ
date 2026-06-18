// Due Date Service (T060)
// Scans for upcoming and overdue tasks

import { adminDb } from '@/src/firebase/admin';
import { createAlert } from '@/src/domain/notifications/notification-service';
import type { Task } from '@/src/types/domain';

/**
 * Find tasks due within N days
 */
export async function getUpcomingDueTasks(daysAhead: number = 3): Promise<Task[]> {
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  const snapshot = await adminDb
    .collection('tasks')
    .where('dueDate', '>=', now)
    .where('dueDate', '<=', futureDate)
    .where('archived', '==', false)
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt.toDate(),
    updatedAt: doc.data().updatedAt.toDate(),
    dueDate: doc.data().dueDate?.toDate(),
  })) as Task[];
}

/**
 * Find overdue tasks
 */
export async function getOverdueTasks(): Promise<Task[]> {
  const now = new Date();

  const snapshot = await adminDb
    .collection('tasks')
    .where('dueDate', '<', now)
    .where('archived', '==', false)
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt.toDate(),
    updatedAt: doc.data().updatedAt.toDate(),
    dueDate: doc.data().dueDate?.toDate(),
  })) as Task[];
}

/**
 * Create due-date alerts for upcoming tasks
 */
export async function alertUpcomingDueTasks(daysAhead: number = 3): Promise<number> {
  const tasks = await getUpcomingDueTasks(daysAhead);
  let alertCount = 0;

  for (const task of tasks) {
    if (task.responsibleUserId && task.dueDate) {
      const daysUntilDue = Math.ceil(
        (task.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilDue === 1) {
        // Due tomorrow
        await createAlert(
          'due_upcoming',
          task.id,
          task.responsibleUserId,
          'Sistema',
          `Tarefa "${task.title}" vence amanhã`,
          { taskId: task.id, daysUntil: 1 }
        );
        alertCount++;
      } else if (daysUntilDue <= daysAhead && daysUntilDue > 1) {
        // Due within N days
        await createAlert(
          'due_upcoming',
          task.id,
          task.responsibleUserId,
          'Sistema',
          `Tarefa "${task.title}" vence em ${daysUntilDue} dias`,
          { taskId: task.id, daysUntil: daysUntilDue }
        );
        alertCount++;
      }
    }
  }

  return alertCount;
}

/**
 * Create alerts for overdue tasks
 */
export async function alertOverdueTasks(): Promise<number> {
  const tasks = await getOverdueTasks();
  let alertCount = 0;

  for (const task of tasks) {
    if (task.responsibleUserId && task.dueDate) {
      const daysSinceDue = Math.ceil(
        (new Date().getTime() - task.dueDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      await createAlert(
        'due_overdue',
        task.id,
        task.responsibleUserId,
        'Sistema',
        `Tarefa "${task.title}" está vencida há ${daysSinceDue} dias`,
        { taskId: task.id, daysSinceDue }
      );
      alertCount++;
    }
  }

  return alertCount;
}

/**
 * Run all due-date scanning and alerting
 * Call this periodically from a scheduled job
 */
export async function runDueDateCheck(): Promise<{ upcoming: number; overdue: number }> {
  const upcoming = await alertUpcomingDueTasks(3);
  const overdue = await alertOverdueTasks();

  return { upcoming, overdue };
}
