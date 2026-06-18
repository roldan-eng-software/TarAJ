// Archive Query Service (T068)
// Query and filter archived tasks

import { adminDb } from '@/src/firebase/admin';
import type { Task } from '@/src/types/domain';

/**
 * Get archived tasks with optional filtering
 */
export async function getArchivedTasks(
  filters?: {
    stageId?: string;
    priority?: string;
    responsibleUserId?: string;
    searchTerm?: string;
  },
  limit: number = 50,
  offset: number = 0
): Promise<Task[]> {
  let query: FirebaseFirestore.Query = adminDb
    .collection('tasks')
    .where('archived', '==', true);

  if (filters?.stageId) {
    query = query.where('stageId', '==', filters.stageId);
  }

  if (filters?.priority) {
    query = query.where('priority', '==', filters.priority);
  }

  if (filters?.responsibleUserId) {
    query = query.where('responsibleUserId', '==', filters.responsibleUserId);
  }

  const snapshot = await query.orderBy('updatedAt', 'desc').limit(limit).offset(offset).get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt.toDate(),
    updatedAt: doc.data().updatedAt.toDate(),
    dueDate: doc.data().dueDate?.toDate(),
  })) as Task[];
}

/**
 * Search archived tasks by title or description
 */
export async function searchArchivedTasks(
  searchTerm: string,
  limit: number = 50
): Promise<Task[]> {
  const normalizedTerm = searchTerm.toLowerCase().trim();

  const snapshot = await adminDb
    .collection('tasks')
    .where('archived', '==', true)
    .orderBy('updatedAt', 'desc')
    .limit(limit)
    .get();

  // Client-side filtering since Firestore doesn't have full-text search
  const filtered = snapshot.docs.filter((doc) => {
    const data = doc.data();
    const title = (data.title || '').toLowerCase();
    const description = (data.description || '').toLowerCase();
    const referenceCode = (data.referenceCode || '').toLowerCase();

    return (
      title.includes(normalizedTerm) ||
      description.includes(normalizedTerm) ||
      referenceCode.includes(normalizedTerm)
    );
  });

  return filtered.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt.toDate(),
    updatedAt: doc.data().updatedAt.toDate(),
    dueDate: doc.data().dueDate?.toDate(),
  })) as Task[];
}

/**
 * Get archived tasks count
 */
export async function countArchivedTasks(): Promise<number> {
  const snapshot = await adminDb.collection('tasks').where('archived', '==', true).count().get();

  return snapshot.data().count;
}

/**
 * Get tasks archived by a specific user
 */
export async function getTasksArchivedByUser(userId: string): Promise<Task[]> {
  const snapshot = await adminDb
    .collection('tasks')
    .where('archived', '==', true)
    .where('archivedBy', '==', userId)
    .orderBy('archivedAt', 'desc')
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
 * Get recently archived tasks (last N days)
 */
export async function getRecentlyArchivedTasks(days: number = 30): Promise<Task[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const snapshot = await adminDb
    .collection('tasks')
    .where('archived', '==', true)
    .where('archivedAt', '>=', cutoffDate)
    .orderBy('archivedAt', 'desc')
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt.toDate(),
    updatedAt: doc.data().updatedAt.toDate(),
    dueDate: doc.data().dueDate?.toDate(),
  })) as Task[];
}
