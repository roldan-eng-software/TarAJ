// Attachment Service (T048)
// Manages task attachments with storage and metadata

import { adminStorage, adminDb } from '@/src/firebase/admin';
import { recordHistoryEvent } from '@/src/domain/history/history-service';
import { logAudit } from '@/src/domain/audit/audit-service';
import type { SessionUser } from '@/src/types/domain';

export interface TaskAttachment {
  id: string;
  taskId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  uploadedByName: string;
  downloadUrl?: string;
  createdAt: Date;
}

/**
 * Get storage path for task attachment
 */
export function getAttachmentStoragePath(taskId: string, attachmentId: string): string {
  return `tasks/${taskId}/attachments/${attachmentId}`;
}

/**
 * Create attachment metadata and upload URL
 */
export async function createAttachmentMetadata(
  taskId: string,
  attachmentId: string,
  fileName: string,
  fileSize: number,
  mimeType: string,
  uploader: SessionUser
): Promise<TaskAttachment> {
  const now = new Date();

  const metadata: Omit<TaskAttachment, 'id' | 'downloadUrl'> = {
    taskId,
    fileName,
    fileSize,
    mimeType,
    uploadedBy: uploader.uid,
    uploadedByName: uploader.displayName,
    createdAt: now,
  };

  await adminDb
    .collection('tasks')
    .doc(taskId)
    .collection('attachments')
    .doc(attachmentId)
    .set(metadata);

  // Record history event
  await recordHistoryEvent(taskId, 'attachment_added', uploader.uid, uploader.roleId, {
    attachmentId,
    fileName,
    fileSize,
    uploadedBy: uploader.displayName,
  });

  // Log audit
  await logAudit(
    uploader.uid,
    uploader.roleId,
    'create',
    'attachment',
    attachmentId,
    'success',
    { taskId, fileName, fileSize }
  );

  return {
    id: attachmentId,
    ...metadata,
  };
}

/**
 * Get attachment metadata
 */
export async function getAttachment(
  taskId: string,
  attachmentId: string
): Promise<TaskAttachment | null> {
  const doc = await adminDb
    .collection('tasks')
    .doc(taskId)
    .collection('attachments')
    .doc(attachmentId)
    .get();

  if (!doc.exists) {
    return null;
  }

  return {
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data()?.createdAt.toDate(),
  } as TaskAttachment;
}

/**
 * Get all attachments for a task
 */
export async function getTaskAttachments(taskId: string): Promise<TaskAttachment[]> {
  const snapshot = await adminDb
    .collection('tasks')
    .doc(taskId)
    .collection('attachments')
    .orderBy('createdAt', 'desc')
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt.toDate(),
  })) as TaskAttachment[];
}

/**
 * Get signed download URL for attachment
 */
export async function getDownloadUrl(
  taskId: string,
  attachmentId: string,
  expiresInHours: number = 24
): Promise<string> {
  const path = getAttachmentStoragePath(taskId, attachmentId);
  const bucket = adminStorage.bucket();

  const [url] = await bucket.file(path).getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + expiresInHours * 60 * 60 * 1000,
  });

  return url;
}

/**
 * Delete attachment from storage and metadata
 */
export async function deleteAttachment(
  taskId: string,
  attachmentId: string,
  deleter: SessionUser
): Promise<void> {
  const path = getAttachmentStoragePath(taskId, attachmentId);

  // Delete from storage
  await adminStorage.bucket().file(path).delete();

  // Delete metadata
  await adminDb
    .collection('tasks')
    .doc(taskId)
    .collection('attachments')
    .doc(attachmentId)
    .delete();

  await logAudit(
    deleter.uid,
    deleter.roleId,
    'delete',
    'attachment',
    attachmentId,
    'success',
    { taskId }
  );
}

/**
 * Count attachments on a task
 */
export async function countTaskAttachments(taskId: string): Promise<number> {
  const snapshot = await adminDb
    .collection('tasks')
    .doc(taskId)
    .collection('attachments')
    .get();

  return snapshot.size;
}

/**
 * Get total attachment size for a task (in bytes)
 */
export async function getTotalAttachmentSize(taskId: string): Promise<number> {
  const attachments = await getTaskAttachments(taskId);
  return attachments.reduce((total, att) => total + att.fileSize, 0);
}
