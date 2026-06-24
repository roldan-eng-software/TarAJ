import { adminDb, FieldValue } from '@/src/firebase/admin';
import { sendWhatsAppMessage } from '@/src/domain/notifications/whatsapp-sender';
import type { WhatsAppJob } from '@/src/types/domain';

export type WhatsAppJobStatus = 'pending' | 'sent' | 'failed';

export async function queueWhatsAppMessage(
  recipientPhone: string,
  recipientName: string,
  message: string,
  metadata?: Record<string, unknown>
): Promise<WhatsAppJob> {
  const now = new Date();

  const job: Omit<WhatsAppJob, 'id'> = {
    recipientPhone,
    recipientName,
    message,
    metadata,
    status: 'pending',
    attempts: 0,
    maxAttempts: 3,
    createdAt: now,
    sentAt: null,
    error: null,
  };

  const ref = await adminDb.collection('whatsappQueue').add(job);

  return {
    id: ref.id,
    ...job,
  };
}

export async function getPendingWhatsAppMessages(limit: number = 50): Promise<WhatsAppJob[]> {
  const snapshot = await adminDb
    .collection('whatsappQueue')
    .where('status', '==', 'pending')
    .get();

  const jobs: WhatsAppJob[] = [];

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
      } as WhatsAppJob);
    } catch {
      // Skip malformed documents
    }
  }

  jobs.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  return jobs.slice(0, limit);
}

export async function updateWhatsAppJobStatus(
  jobId: string,
  status: WhatsAppJobStatus,
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

  await adminDb.collection('whatsappQueue').doc(jobId).update(updates);
}

export async function getWhatsAppJobsByStatus(
  status: WhatsAppJobStatus | 'all',
  limit: number = 100
): Promise<WhatsAppJob[]> {
  const baseQuery = adminDb.collection('whatsappQueue').orderBy('createdAt', 'desc');

  const snapshot = status === 'all'
    ? await baseQuery.limit(limit).get()
    : await baseQuery.where('status', '==', status).limit(limit).get();

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt) || new Date(),
      sentAt: data.sentAt?.toDate?.() || null,
    } as WhatsAppJob;
  });
}

export async function countPendingWhatsAppMessages(): Promise<number> {
  const snapshot = await adminDb
    .collection('whatsappQueue')
    .where('status', '==', 'pending')
    .get();

  return snapshot.docs.filter((doc) => {
    const data = doc.data();
    return (data.attempts || 0) < 3;
  }).length;
}

export async function cleanupOldWhatsAppJobs(retentionDays: number = 30): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  const batch = adminDb.batch();
  const oldJobs = await adminDb
    .collection('whatsappQueue')
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

export async function processPendingWhatsAppMessages(limit: number = 10): Promise<number> {
  const pendingJobs = await getPendingWhatsAppMessages(limit);
  let processed = 0;

  for (const job of pendingJobs) {
    try {
      await sendWhatsAppMessage({
        phone: job.recipientPhone,
        message: job.message,
      });

      await updateWhatsAppJobStatus(job.id, 'sent');
      processed++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await updateWhatsAppJobStatus(job.id, 'failed', message);
      console.error(`Failed to send WhatsApp job ${job.id}:`, message);
    }
  }

  return processed;
}

export async function processAllPendingWhatsAppMessages(): Promise<number> {
  let total = 0;
  let batch: number;

  do {
    batch = await processPendingWhatsAppMessages(50);
    total += batch;
  } while (batch > 0);

  return total;
}
