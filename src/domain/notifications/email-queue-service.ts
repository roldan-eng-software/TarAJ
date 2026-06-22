// Email Queue Service (T059)
// Manages email scheduling and provider abstraction

import { adminDb, FieldValue } from '@/src/firebase/admin';
import { sendEmail } from '@/src/domain/notifications/email-sender';
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
    .get();

  const jobs: EmailJob[] = [];

  for (const doc of snapshot.docs) {
    try {
      const data = doc.data();
      const attempts = typeof data.attempts === 'number' ? data.attempts : 0;
      if (attempts >= 3) continue;

      jobs.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt) || new Date(),
        sentAt: data.sentAt?.toDate?.() || null,
      } as EmailJob);
    } catch {
      // Skip malformed documents
    }
  }

  jobs.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  return jobs.slice(0, limit);
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
    .get();

  return snapshot.docs.filter((doc) => {
    const data = doc.data();
    return (data.attempts || 0) < 3;
  }).length;
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
    .where('status', '==', 'sent')
    .where('createdAt', '<', cutoffDate)
    .limit(500)
    .get();

  oldJobs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  return oldJobs.size;
}

/**
 * Process pending email jobs (up to `limit`)
 * Returns the number of successfully sent emails
 */
export async function processPendingEmails(limit: number = 10): Promise<number> {
  const pendingJobs = await getPendingEmails(limit);
  let processed = 0;

  for (const job of pendingJobs) {
    try {
      await sendEmail({
        to: job.recipientEmail,
        subject: job.subject,
        text: job.body,
        html: job.htmlBody,
      });

      await updateEmailJobStatus(job.id, 'sent');
      processed++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await updateEmailJobStatus(job.id, 'failed', message);
      console.error(`Failed to send email job ${job.id}:`, message);
    }
  }

  return processed;
}

/**
 * Process ALL pending email jobs (calls processPendingEmails in batches)
 */
export async function processAllPendingEmails(): Promise<number> {
  let total = 0;
  let batch: number;

  do {
    batch = await processPendingEmails(50);
    total += batch;
  } while (batch > 0);

  return total;
}
