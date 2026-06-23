// Notification Service (T058)
// Creates and manages internal alerts with deduplication

import { adminDb } from '@/src/firebase/admin';
import type { Alert } from '@/src/types/domain';

export type AlertEventType =
  | 'task_created'
  | 'task_assigned'
  | 'responsible_changed'
  | 'stage_changed'
  | 'stage_moved_backward'
  | 'mentioned'
  | 'mentioned_in_comment'
  | 'backward_move'
  | 'task_completed'
  | 'task_archived'
  | 'task_restored'
  | 'due_upcoming'
  | 'due_overdue';

// Event types that can fire from cron/scheduled jobs and need deduplication
const CRON_EVENT_TYPES = new Set<AlertEventType>(['due_upcoming', 'due_overdue']);

/**
 * Create deduplication key for alert
 * Format: eventType_taskId_recipientId_suffix
 */
export function generateDedupeKey(
  eventType: AlertEventType,
  taskId: string,
  recipientId: string,
  suffix: string = 'v1'
): string {
  return `${eventType}_${taskId}_${recipientId}_${suffix}`;
}

/**
 * Create an internal alert notification
 *
 * User-triggered events (stage_changed, responsible_changed, etc.) always create
 * a new alert with a unique dedupeKey so no event is lost.
 * Cron-triggered events (due_upcoming, due_overdue) use a stable dedupeKey
 * and skip creation if an unread alert with the same key already exists.
 */
export async function createAlert(
  eventType: AlertEventType,
  taskId: string,
  recipientId: string,
  actorName: string,
  message: string,
  metadata?: Record<string, unknown>
): Promise<Alert> {
  const now = new Date();

  // Cron events use a stable dedupeKey to prevent spam across cron runs.
  // User events include a timestamp suffix so every distinct action creates a new alert.
  const isCronEvent = CRON_EVENT_TYPES.has(eventType);
  const dedupeKey = isCronEvent
    ? generateDedupeKey(eventType, taskId, recipientId)
    : generateDedupeKey(eventType, taskId, recipientId, `${now.getTime()}`);

  // Deduplication check only for cron events
  if (isCronEvent) {
    const existing = await adminDb
      .collection('alerts')
      .where('dedupeKey', '==', dedupeKey)
      .where('readAt', '==', null)
      .limit(1)
      .get();

    if (existing.size > 0) {
      const doc = existing.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
      } as Alert;
    }
  }

  const alert: Omit<Alert, 'id'> = {
    eventType,
    taskId,
    recipientId,
    actorName,
    message,
    dedupeKey,
    metadata,
    readAt: null,
    createdAt: now,
  };

  const ref = await adminDb.collection('alerts').add(alert);

  return {
    id: ref.id,
    ...alert,
  };
}

/**
 * Get unread alerts for a user
 */
export async function getUserUnreadAlerts(userId: string, limit: number = 50): Promise<Alert[]> {
  const snapshot = await adminDb
    .collection('alerts')
    .where('recipientId', '==', userId)
    .where('readAt', '==', null)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt.toDate(),
  })) as Alert[];
}

/**
 * Get all alerts for a user (read and unread)
 */
export async function getUserAlerts(
  userId: string,
  limit: number = 100,
  offset: number = 0
): Promise<Alert[]> {
  const snapshot = await adminDb
    .collection('alerts')
    .where('recipientId', '==', userId)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .offset(offset)
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt.toDate(),
  })) as Alert[];
}

/**
 * Mark alert as read
 */
export async function markAlertAsRead(alertId: string): Promise<void> {
  await adminDb.collection('alerts').doc(alertId).update({
    readAt: new Date(),
  });
}

/**
 * Mark all unread alerts as read for a user
 */
export async function markAllAlertsAsRead(userId: string): Promise<number> {
  const batch = adminDb.batch();
  const unread = await getUserUnreadAlerts(userId, 1000);

  unread.forEach((alert) => {
    batch.update(adminDb.collection('alerts').doc(alert.id), {
      readAt: new Date(),
    });
  });

  await batch.commit();
  return unread.length;
}

/**
 * Count unread alerts for a user
 */
export async function countUnreadAlerts(userId: string): Promise<number> {
  const snapshot = await adminDb
    .collection('alerts')
    .where('recipientId', '==', userId)
    .where('readAt', '==', null)
    .count()
    .get();

  return snapshot.data().count;
}

/**
 * Delete old alerts (older than retention days)
 */
export async function deleteOldAlerts(retentionDays: number = 30): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  const batch = adminDb.batch();
  const oldAlerts = await adminDb
    .collection('alerts')
    .where('createdAt', '<', cutoffDate)
    .limit(500)
    .get();

  oldAlerts.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  return oldAlerts.size;
}
