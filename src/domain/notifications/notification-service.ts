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

/**
 * Create deduplication key for alert
 * Format: eventType_taskId_recipientId_version
 */
export function generateDedupeKey(
  eventType: AlertEventType,
  taskId: string,
  recipientId: string,
  version: number = 1
): string {
  return `${eventType}_${taskId}_${recipientId}_v${version}`;
}

/**
 * Create an internal alert notification
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
  const dedupeKey = generateDedupeKey(eventType, taskId, recipientId);

  // Check for existing unread alert with same dedup key
  const existing = await adminDb
    .collection('alerts')
    .where('dedupeKey', '==', dedupeKey)
    .where('readAt', '==', null)
    .limit(1)
    .get();

  if (existing.size > 0) {
    // Alert already exists and unread, don't duplicate
    const doc = existing.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
    } as Alert;
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
