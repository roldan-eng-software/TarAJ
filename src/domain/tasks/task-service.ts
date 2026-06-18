// Task Service
// Core task creation and management logic
// TODO: Implement full CRUD operations with RBAC checks and event triggers

import { adminDb } from '@/src/firebase/admin';
import type { Task, CreateTaskInput, UpdateTaskInput, SessionUser } from '@/src/types/domain';
import { assertCan } from '@/src/domain/rbac/rbac-service';
import { generateReferenceCode } from '@/src/domain/tasks/task-validation';

/**
 * Create a new task
 * TODO: Add RBAC check, history recording, notification trigger
 */
export async function createTask(
  input: CreateTaskInput,
  creator: SessionUser
): Promise<Task> {
  // Check permissions
  assertCan(creator, 'create', 'task');

  const now = new Date();
  const referenceCode = generateReferenceCode();

  const taskData: Task = {
    id: '', // Firestore will generate
    referenceCode,
    title: input.title,
    description: input.description,
    category: input.category,
    priority: input.priority,
    stageId: 'entrada', // Always start at entrada
    responsibleUserId: input.responsibleUserId,
    participantIds: input.participantIds,
    dueDate: input.dueDate,
    confidentialityLevel: input.confidentialityLevel,
    internalNotes: input.internalNotes,
    archived: false,
    createdAt: now,
    createdBy: creator.uid,
    updatedAt: now,
    updatedBy: creator.uid,
  };

  const ref = await adminDb.collection('tasks').add(taskData);

  return {
    ...taskData,
    id: ref.id,
  };
}

/**
 * Get task by ID
 * TODO: Add access permission check
 */
export async function getTask(taskId: string): Promise<Task | null> {
  const doc = await adminDb.collection('tasks').doc(taskId).get();

  if (!doc.exists) {
    return null;
  }

  return {
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data()?.createdAt.toDate(),
    updatedAt: doc.data()?.updatedAt.toDate(),
    dueDate: doc.data()?.dueDate?.toDate(),
  } as Task;
}

/**
 * List tasks (with filtering)
 * TODO: Implement filtering, pagination, permission scoping
 */
export async function listTasks(
  filters?: {
    stageId?: string;
    responsibleUserId?: string;
    priority?: string;
    archived?: boolean;
  },
  limit: number = 50
): Promise<Task[]> {
  let query: FirebaseFirestore.Query = adminDb.collection('tasks');

  if (filters?.archived !== undefined) {
    query = query.where('archived', '==', filters.archived);
  }

  const snapshot = await query.limit(limit).get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt.toDate(),
    updatedAt: doc.data().updatedAt.toDate(),
    dueDate: doc.data().dueDate?.toDate(),
  })) as Task[];
}

/**
 * Update task
 * TODO: Add RBAC check, history recording, notification trigger
 */
export async function updateTask(
  taskId: string,
  input: Partial<UpdateTaskInput>,
  updater: SessionUser
): Promise<Task> {
  assertCan(updater, 'edit', 'task');

  const now = new Date();

  const updates = {
    ...input,
    updatedAt: now,
    updatedBy: updater.uid,
  };

  await adminDb.collection('tasks').doc(taskId).update(updates);

  const updated = await getTask(taskId);
  if (!updated) {
    throw new Error('Task not found');
  }

  return updated;
}

/**
 * Delete task (not recommended - use archiving instead)
 * Restricted to prevent data loss
 */
export async function deleteTask(taskId: string, deleter: SessionUser): Promise<void> {
  assertCan(deleter, 'delete', 'task');

  // In production, this would be further restricted
  // Consider soft-delete (archiving) instead
  await adminDb.collection('tasks').doc(taskId).delete();
}
