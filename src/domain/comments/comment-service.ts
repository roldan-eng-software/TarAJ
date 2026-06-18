// Comment Service (T047)
// Manages task comments with mention extraction and history recording

import { adminDb } from '@/src/firebase/admin';
import { recordHistoryEvent } from '@/src/domain/history/history-service';
import { logAudit } from '@/src/domain/audit/audit-service';
import type { SessionUser } from '@/src/types/domain';

export interface TaskComment {
  id: string;
  taskId: string;
  authorId: string;
  authorName: string;
  content: string;
  mentions: string[]; // Array of user IDs mentioned with @
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Extract mentions from comment text (@username format)
 */
export function extractMentions(content: string): string[] {
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1]);
  }

  return [...new Set(mentions)]; // Deduplicate
}

/**
 * Create a new comment on a task
 */
export async function createComment(
  taskId: string,
  content: string,
  author: SessionUser
): Promise<TaskComment> {
  const mentions = extractMentions(content);
  const now = new Date();

  const comment: Omit<TaskComment, 'id'> = {
    taskId,
    authorId: author.uid,
    authorName: author.displayName,
    content,
    mentions,
    createdAt: now,
    updatedAt: now,
  };

  const ref = await adminDb
    .collection('tasks')
    .doc(taskId)
    .collection('comments')
    .add(comment);

  // Record history event
  await recordHistoryEvent(taskId, 'comment_added', author.uid, author.roleId, {
    commentId: ref.id,
    authorName: author.displayName,
    preview: content.substring(0, 100),
  });

  // Log audit
  await logAudit(
    author.uid,
    author.roleId,
    'create',
    'comment',
    ref.id,
    'success',
    { taskId, mentions }
  );

  return {
    id: ref.id,
    ...comment,
  };
}

/**
 * Get all comments for a task
 */
export async function getTaskComments(taskId: string): Promise<TaskComment[]> {
  const snapshot = await adminDb
    .collection('tasks')
    .doc(taskId)
    .collection('comments')
    .orderBy('createdAt', 'asc')
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt.toDate(),
    updatedAt: doc.data().updatedAt.toDate(),
  })) as TaskComment[];
}

/**
 * Get comments authored by a specific user
 */
export async function getUserComments(
  taskId: string,
  userId: string
): Promise<TaskComment[]> {
  const snapshot = await adminDb
    .collection('tasks')
    .doc(taskId)
    .collection('comments')
    .where('authorId', '==', userId)
    .orderBy('createdAt', 'asc')
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt.toDate(),
    updatedAt: doc.data().updatedAt.toDate(),
  })) as TaskComment[];
}

/**
 * Get comments that mention a specific user
 */
export async function getCommentsMentioningUser(
  taskId: string,
  userId: string
): Promise<TaskComment[]> {
  const snapshot = await adminDb
    .collection('tasks')
    .doc(taskId)
    .collection('comments')
    .where('mentions', 'array-contains', userId)
    .orderBy('createdAt', 'asc')
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt.toDate(),
    updatedAt: doc.data().updatedAt.toDate(),
  })) as TaskComment[];
}

/**
 * Delete a comment (soft-delete via flag preferred)
 */
export async function deleteComment(
  taskId: string,
  commentId: string,
  deleter: SessionUser
): Promise<void> {
  await adminDb
    .collection('tasks')
    .doc(taskId)
    .collection('comments')
    .doc(commentId)
    .delete();

  await logAudit(
    deleter.uid,
    deleter.roleId,
    'delete',
    'comment',
    commentId,
    'success',
    { taskId }
  );
}

/**
 * Count comments on a task
 */
export async function countTaskComments(taskId: string): Promise<number> {
  const snapshot = await adminDb
    .collection('tasks')
    .doc(taskId)
    .collection('comments')
    .get();

  return snapshot.size;
}
