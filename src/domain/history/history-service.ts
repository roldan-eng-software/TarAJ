// History Service
// Append-only task history tracking

import { adminDb } from '@/src/firebase/admin';
import type { Task, TaskHistory, HistoryEventType } from '@/src/types/domain';

export type HistoryMetadata = Record<string, unknown>;

/**
 * Record a task history event (append-only)
 */
export async function recordHistoryEvent(
  taskId: string,
  eventType: HistoryEventType,
  actor: string,
  actorRole: string,
  metadata?: HistoryMetadata
): Promise<string> {
  const now = new Date();

  const historyEntry: Record<string, unknown> = {
    taskId,
    eventType,
    actor,
    actorRole,
    previousValue: metadata?.previousValue,
    newValue: metadata?.newValue,
    metadata,
    occurredAt: now,
  };

  // Add to task history subcollection (append-only)
  const historyRef = await adminDb
    .collection('tasks')
    .doc(taskId)
    .collection('history')
    .add(historyEntry);

  return historyRef.id;
}

/**
 * Get task history in chronological order
 */
export async function getTaskHistory(taskId: string): Promise<TaskHistory[]> {
  const snapshot = await adminDb
    .collection('tasks')
    .doc(taskId)
    .collection('history')
    .orderBy('occurredAt', 'asc')
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    occurredAt: doc.data().occurredAt.toDate(),
  })) as TaskHistory[];
}

/**
 * Record task creation history
 */
export async function recordTaskCreation(
  taskId: string,
  actor: string,
  actorRole: string,
  taskData: Partial<Task>
): Promise<void> {
  await recordHistoryEvent(taskId, 'created', actor, actorRole, {
    newValue: taskData,
  });
}

/**
 * Record stage change history
 */
export async function recordStageChange(
  taskId: string,
  actor: string,
  actorRole: string,
  fromStage: string,
  toStage: string,
  notes?: string
): Promise<void> {
  await recordHistoryEvent(taskId, 'stage_changed', actor, actorRole, {
    previousValue: fromStage,
    newValue: toStage,
    notes,
  });
}

/**
 * Record responsible user change
 */
export async function recordResponsibleChange(
  taskId: string,
  actor: string,
  actorRole: string,
  fromUserId: string,
  toUserId: string
): Promise<void> {
  await recordHistoryEvent(taskId, 'responsible_changed', actor, actorRole, {
    previousValue: fromUserId,
    newValue: toUserId,
  });
}

/**
 * Record task completion
 */
export async function recordTaskCompletion(
  taskId: string,
  actor: string,
  actorRole: string
): Promise<void> {
  await recordHistoryEvent(taskId, 'completed', actor, actorRole);
}

/**
 * Record task archiving
 */
export async function recordTaskArchiving(
  taskId: string,
  actor: string,
  actorRole: string
): Promise<void> {
  await recordHistoryEvent(taskId, 'archived', actor, actorRole);
}
