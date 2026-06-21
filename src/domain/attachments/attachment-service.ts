import { put, del } from '@vercel/blob';
import { adminDb } from '@/src/firebase/admin';
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
  blobUrl?: string;
  createdAt: Date;
}

export function getAttachmentStoragePath(taskId: string, attachmentId: string, fileName: string): string {
  return `tasks/${taskId}/${attachmentId}/${fileName}`;
}

export async function uploadAttachment(
  taskId: string,
  attachmentId: string,
  fileName: string,
  fileBuffer: Buffer,
  mimeType: string,
  uploader: SessionUser
): Promise<TaskAttachment> {
  const pathname = getAttachmentStoragePath(taskId, attachmentId, fileName);

  const { url } = await put(pathname, fileBuffer, {
    contentType: mimeType,
    access: 'public',
  });

  const now = new Date();

  const metadata: Omit<TaskAttachment, 'id'> = {
    taskId,
    fileName,
    fileSize: fileBuffer.length,
    mimeType,
    uploadedBy: uploader.uid,
    uploadedByName: uploader.displayName,
    blobUrl: url,
    createdAt: now,
  };

  await adminDb
    .collection('tasks')
    .doc(taskId)
    .collection('attachments')
    .doc(attachmentId)
    .set(metadata);

  await recordHistoryEvent(taskId, 'attachment_added', uploader.uid, uploader.roleId, {
    attachmentId,
    fileName,
    fileSize: fileBuffer.length,
    uploadedBy: uploader.displayName,
  });

  await logAudit(
    uploader.uid,
    uploader.roleId,
    'create',
    'attachment',
    attachmentId,
    'success',
    { taskId, fileSize: fileBuffer.length }
  );

  return { id: attachmentId, ...metadata };
}

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

  if (!doc.exists) return null;

  return {
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data()?.createdAt.toDate(),
  } as TaskAttachment;
}

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

export async function getDownloadUrl(taskId: string, attachmentId: string): Promise<string | null> {
  const attachment = await getAttachment(taskId, attachmentId);
  return attachment?.blobUrl || null;
}

export async function deleteAttachment(
  taskId: string,
  attachmentId: string,
  deleter: SessionUser
): Promise<void> {
  const attachment = await getAttachment(taskId, attachmentId);
  if (!attachment) return;

  if (attachment.blobUrl) {
    await del(attachment.blobUrl);
  }

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

export async function countTaskAttachments(taskId: string): Promise<number> {
  const snapshot = await adminDb
    .collection('tasks')
    .doc(taskId)
    .collection('attachments')
    .get();

  return snapshot.size;
}

export async function getTotalAttachmentSize(taskId: string): Promise<number> {
  const attachments = await getTaskAttachments(taskId);
  return attachments.reduce((total, att) => total + att.fileSize, 0);
}
