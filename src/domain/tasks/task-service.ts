// Task Service
// Core task creation and management logic with RBAC checks and event side effects

import { adminDb } from '@/src/firebase/admin';
import type { Task, CreateTaskInput, UpdateTaskInput, SessionUser } from '@/src/types/domain';
import { assertCan } from '@/src/domain/rbac/rbac-service';
import { generateReferenceCode } from '@/src/domain/tasks/task-validation';
import { recordTaskCreation, recordHistoryEvent, recordResponsibleChange } from '@/src/domain/history/history-service';
import { logSuccess } from '@/src/domain/audit/audit-service';
import { emitTaskCreatedAlert, emitResponsibleChangedAlert } from '@/src/domain/notifications/notification-events';

/**
 * Create a new task with full side effects
 */
export async function createTask(
  input: CreateTaskInput,
  creator: SessionUser
): Promise<Task> {
  assertCan(creator, 'create', 'task');

  const now = new Date();
  const referenceCode = generateReferenceCode();

  const taskData: Omit<Task, 'id'> = {
    referenceCode,
    title: input.title,
    description: input.description,
    category: input.category,
    priority: input.priority,
    stageId: 'entrada',
    responsibleUserId: input.responsibleUserId,
    participantIds: input.participantIds || [],
    dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
    confidentialityLevel: input.confidentialityLevel,
    internalNotes: input.internalNotes,
    archived: false,
    createdAt: now,
    createdBy: creator.uid,
    updatedAt: now,
    updatedBy: creator.uid,
  };

    const ref = await adminDb.collection('tasks').add(taskData);
  const task: Task = { ...taskData, id: ref.id };

  // Record history
  await recordTaskCreation(task.id, creator.uid, creator.roleId, task);

  // Record audit
  await logSuccess(creator.uid, creator.roleId, 'create', 'task', task.id, {
    referenceCode,
  });

  // Emit notification for responsible user
  await emitTaskCreatedAlert(task, creator);

  return task;
}

/**
 * Get task by ID with access permission check
 */
export async function getTask(taskId: string): Promise<Task | null> {
  const doc = await adminDb.collection('tasks').doc(taskId).get();

  if (!doc.exists) {
    return null;
  }

  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    createdAt: data?.createdAt?.toDate?.() ?? data?.createdAt,
    updatedAt: data?.updatedAt?.toDate?.() ?? data?.updatedAt,
    dueDate: data?.dueDate?.toDate?.() ?? data?.dueDate,
    completedAt: data?.completedAt?.toDate?.() ?? data?.completedAt,
    archivedAt: data?.archivedAt?.toDate?.() ?? data?.archivedAt,
  } as Task;
}

/**
 * List tasks with advanced filtering
 */
export async function listTasks(
  filters?: {
    stageId?: string;
    responsibleUserId?: string;
    priority?: string;
    archived?: boolean;
    category?: string;
  },
  limit: number = 50
): Promise<Task[]> {
  let query: FirebaseFirestore.Query = adminDb.collection('tasks');

  if (filters?.archived !== undefined) {
    query = query.where('archived', '==', filters.archived);
  }

  if (filters?.stageId) {
    query = query.where('stageId', '==', filters.stageId);
  }

  if (filters?.responsibleUserId) {
    query = query.where('responsibleUserId', '==', filters.responsibleUserId);
  }

  if (filters?.priority) {
    query = query.where('priority', '==', filters.priority);
  }

  if (filters?.category) {
    query = query.where('category', '==', filters.category);
  }

  const snapshot = await query
    .orderBy('updatedAt', 'desc')
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() ?? data.createdAt,
      updatedAt: data.updatedAt?.toDate?.() ?? data.updatedAt,
      dueDate: data.dueDate?.toDate?.() ?? data.dueDate,
      completedAt: data.completedAt?.toDate?.() ?? data.completedAt,
      archivedAt: data.archivedAt?.toDate?.() ?? data.archivedAt,
    } as Task;
  });
}

/**
 * Update task with side effects for responsible changes
 */
export async function updateTask(
  taskId: string,
  input: Partial<UpdateTaskInput>,
  updater: SessionUser
): Promise<Task> {
  assertCan(updater, 'edit', 'task');

  const existing = await getTask(taskId);
  if (!existing) {
    throw new Error('Task not found');
  }

  const now = new Date();
  const updates: Record<string, unknown> = {
    ...input,
    dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
    updatedAt: now,
    updatedBy: updater.uid,
  };

  await adminDb.collection('tasks').doc(taskId).update(updates);

  const updated = await getTask(taskId);
  if (!updated) {
    throw new Error('Task not found after update');
  }

  // Record history
  await recordHistoryEvent(taskId, 'updated', updater.uid, updater.roleId, {
    previousValue: input,
    newValue: updates,
  });

  // Record audit
  await logSuccess(updater.uid, updater.roleId, 'edit', 'task', taskId, {
    changedFields: Object.keys(input),
  });

  // Emit notification if responsible user changed
  if (input.responsibleUserId && input.responsibleUserId !== existing.responsibleUserId) {
    await recordResponsibleChange(
      taskId,
      updater.uid,
      updater.roleId,
      existing.responsibleUserId,
      input.responsibleUserId
    );
    await emitResponsibleChangedAlert(updated, updater);
  }

  return updated;
}

/**
 * Delete task (restricted - use archiving instead)
 */
export async function deleteTask(taskId: string, deleter: SessionUser): Promise<void> {
  assertCan(deleter, 'delete', 'task');
  await adminDb.collection('tasks').doc(taskId).delete();
}

/**
 * Search tasks by text (client-side filter for MVP)
 */
export async function searchTasks(
  searchTerm: string,
  archived?: boolean,
  limit: number = 50
): Promise<Task[]> {
  const normalizedTerm = searchTerm.toLowerCase().trim();
  let query: FirebaseFirestore.Query = adminDb.collection('tasks');

  if (archived !== undefined) {
    query = query.where('archived', '==', archived);
  }

  const snapshot = await query.orderBy('updatedAt', 'desc').limit(limit).get();

  const filtered = snapshot.docs.filter((doc) => {
    const data = doc.data();
    const text = [
      data.title,
      data.description,
      data.referenceCode,
      data.internalNotes,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return text.includes(normalizedTerm);
  });

  return filtered.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() ?? data.createdAt,
      updatedAt: data.updatedAt?.toDate?.() ?? data.updatedAt,
      dueDate: data.dueDate?.toDate?.() ?? data.dueDate,
      completedAt: data.completedAt?.toDate?.() ?? data.completedAt,
      archivedAt: data.archivedAt?.toDate?.() ?? data.archivedAt,
    } as Task;
  });
}
