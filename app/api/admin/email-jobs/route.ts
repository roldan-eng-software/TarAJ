import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  getPendingEmails,
  updateEmailJobStatus,
  countPendingEmails,
} from '@/src/domain/notifications/email-queue-service';
import { sendEmail } from '@/src/domain/notifications/email-sender';
import { getSessionUser } from '@/src/domain/auth/auth-service';
import { logAudit } from '@/src/domain/audit/audit-service';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSessionUser(token);
    if (!session) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const pendingJobs = await getPendingEmails(limit);
    const totalPending = await countPendingEmails();

    return NextResponse.json({ jobs: pendingJobs, totalPending });
  } catch (error) {
    console.error('Error fetching email jobs:', error);
    return NextResponse.json({ error: 'Failed to fetch email jobs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSessionUser(token);
    if (!session) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { jobId, status, error } = body;

    if (body.action === 'process') {
      const processed = await processPendingEmails(session);
      return NextResponse.json({ processed, success: true });
    }

    if (!jobId || !status) {
      return NextResponse.json({ error: 'jobId and status are required' }, { status: 400 });
    }

    await updateEmailJobStatus(jobId, status, error);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing email jobs:', error);
    return NextResponse.json({ error: 'Failed to process email jobs' }, { status: 500 });
  }
}

async function processPendingEmails(session: { uid: string; roleId: string }): Promise<number> {
  const pendingJobs = await getPendingEmails(10);
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

  if (processed > 0) {
    await logAudit(session.uid, session.roleId, 'manage', 'task', 'email-jobs', 'success', {
      processed,
    });
  }

  return processed;
}
