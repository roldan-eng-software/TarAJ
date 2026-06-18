// Email Queue Service (T059)
// Manages email scheduling and provider abstraction

import { adminDb, FieldValue } from '@/src/firebase/admin';
import type { EmailJob } from '@/src/types/domain';

export type EmailJobStatus = 'pending' | 'sent' | 'failed' | 'bounced';

/**
 * Queue an email for sending
 */
export async function queueEmail(
  recipientEmail: string,
  recipientName: string,
  subject: string,
  body: string,
  htmlBody?: string,
  metadata?: Record<string, unknown>
): Promise<EmailJob> {
  const now = new Date();

  const job: Omit<EmailJob, 'id'> = {
    recipientEmail,
    recipientName,
    subject,
    body,
    htmlBody,
    metadata,
    status: 'pending',
    attempts: 0,
    maxAttempts: 3,
    createdAt: now,
    sentAt: null,
    error: null,
  };

  const ref = await adminDb.collection('emailQueue').add(job);

  return {
    id: ref.id,
    ...job,
  };
}

/**
 * Get pending emails to process
 */
export async function getPendingEmails(limit: number = 50): Promise<EmailJob[]> {
  const snapshot = await adminDb
    .collection('emailQueue')
    .where('status', '==', 'pending')
    .where('attempts', '<', 3)
    .orderBy('createdAt', 'asc')
    .limit(limit)
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt.toDate(),
    sentAt: doc.data().sentAt?.toDate(),
  })) as EmailJob[];
}

/**
 * Update email job status after sending attempt
 */
export async function updateEmailJobStatus(
  jobId: string,
  status: EmailJobStatus,
  error?: string
): Promise<void> {
  const updates: Record<string, unknown> = {
    status,
    attempts: FieldValue.increment(1),
  };

  if (status === 'sent') {
    updates.sentAt = new Date();
  }

  if (error) {
    updates.error = error;
  }

  await adminDb.collection('emailQueue').doc(jobId).update(updates);
}

/**
 * Get email job by ID
 */
export async function getEmailJob(jobId: string): Promise<EmailJob | null> {
  const doc = await adminDb.collection('emailQueue').doc(jobId).get();

  if (!doc.exists) {
    return null;
  }

  return {
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data()?.createdAt.toDate(),
    sentAt: doc.data()?.sentAt?.toDate(),
  } as EmailJob;
}

/**
 * Count pending emails
 */
export async function countPendingEmails(): Promise<number> {
  const snapshot = await adminDb
    .collection('emailQueue')
    .where('status', '==', 'pending')
    .where('attempts', '<', 3)
    .count()
    .get();

  return snapshot.data().count;
}

/**
 * Cleanup old email jobs (older than retention days)
 */
export async function cleanupOldEmailJobs(retentionDays: number = 30): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  const batch = adminDb.batch();
  const oldJobs = await adminDb
    .collection('emailQueue')
    .where('createdAt', '<', cutoffDate)
    .where('status', '==', 'sent')
    .limit(500)
    .get();

  oldJobs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  return oldJobs.size;
}
