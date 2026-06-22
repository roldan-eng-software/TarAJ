// History Query Service (T046)
// Retrieves and aggregates task history for timeline display

import { adminDb } from '@/src/firebase/admin';
import type { TaskHistory } from '@/src/types/domain';

/**
 * Get complete task history ordered chronologically
 */
export async function getTaskHistory(taskId: string): Promise<TaskHistory[]> {
  const snapshot = await adminDb
    .collection('tasks')
    .doc(taskId)
    .collection('history')
    .orderBy('occurredAt', 'desc')
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      taskId: data.taskId || taskId,
      eventType: data.eventType,
      actor: data.actor,
      actorRole: data.actorRole,
      previousValue: data.previousValue,
      newValue: data.newValue,
      metadata: data.metadata,
      occurredAt: data.occurredAt?.toDate() || new Date(),
    } as TaskHistory;
  });
}

export async function getTaskHistoryByType(
  taskId: string,
  eventType: string
): Promise<TaskHistory[]> {
  const snapshot = await adminDb
    .collection('tasks')
    .doc(taskId)
    .collection('history')
    .where('eventType', '==', eventType)
    .orderBy('occurredAt', 'desc')
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      taskId: data.taskId || taskId,
      eventType: data.eventType,
      actor: data.actor,
      actorRole: data.actorRole,
      previousValue: data.previousValue,
      newValue: data.newValue,
      metadata: data.metadata,
      occurredAt: data.occurredAt?.toDate() || new Date(),
    } as TaskHistory;
  });
}

export async function getRecentTaskHistory(
  taskId: string,
  limit: number = 20
): Promise<TaskHistory[]> {
  const snapshot = await adminDb
    .collection('tasks')
    .doc(taskId)
    .collection('history')
    .orderBy('occurredAt', 'desc')
    .limit(limit)
    .get();

  return snapshot.docs
    .map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        taskId: data.taskId || taskId,
        eventType: data.eventType,
        actor: data.actor,
        actorRole: data.actorRole,
        previousValue: data.previousValue,
        newValue: data.newValue,
        metadata: data.metadata,
        occurredAt: data.occurredAt?.toDate() || new Date(),
      } as TaskHistory;
    })
    .reverse();
}

export async function getTaskHistoryByActor(
  taskId: string,
  actorId: string
): Promise<TaskHistory[]> {
  const snapshot = await adminDb
    .collection('tasks')
    .doc(taskId)
    .collection('history')
    .where('actor', '==', actorId)
    .orderBy('occurredAt', 'desc')
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      taskId: data.taskId || taskId,
      eventType: data.eventType,
      actor: data.actor,
      actorRole: data.actorRole,
      previousValue: data.previousValue,
      newValue: data.newValue,
      metadata: data.metadata,
      occurredAt: data.occurredAt?.toDate() || new Date(),
    } as TaskHistory;
  });
}

/**
 * Count history events for a task
 */
export async function countTaskHistory(taskId: string): Promise<number> {
  const snapshot = await adminDb
    .collection('tasks')
    .doc(taskId)
    .collection('history')
    .get();

  return snapshot.size;
}
