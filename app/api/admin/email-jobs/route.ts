import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  getEmailJobsByStatus,
  getPendingEmails,
  updateEmailJobStatus,
  countPendingEmails,
  processPendingEmails,
} from '@/src/domain/notifications/email-queue-service';
import type { EmailJobStatus } from '@/src/domain/notifications/email-queue-service';
import { getSessionFromRequest } from '@/src/lib/session';
import { logAudit } from '@/src/domain/audit/audit-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const statusParam = searchParams.get('status') || 'pending';

    const validStatuses: (EmailJobStatus | 'all')[] = ['all', 'pending', 'sent', 'failed', 'bounced'];
    const status = validStatuses.includes(statusParam as EmailJobStatus | 'all')
      ? (statusParam as EmailJobStatus | 'all')
      : 'pending';

    const jobs = status === 'pending'
      ? await getPendingEmails(limit)
      : await getEmailJobsByStatus(status, limit);

    const totalPending = await countPendingEmails();

    return NextResponse.json({ jobs, totalPending, currentFilter: status });
  } catch (error) {
    console.error('Error fetching email jobs:', error);
    return NextResponse.json({ error: 'Failed to fetch email jobs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { jobId, status, error } = body;

    if (body.action === 'process') {
      const processed = await processPendingEmails(10);
      if (processed > 0) {
        await logAudit(session.uid, session.roleId, 'manage', 'task', 'email-jobs', 'success', {
          processed,
        });
      }
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
