import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  getWhatsAppJobsByStatus,
  getPendingWhatsAppMessages,
  updateWhatsAppJobStatus,
  countPendingWhatsAppMessages,
  processPendingWhatsAppMessages,
} from '@/src/domain/notifications/whatsapp-queue-service';
import type { WhatsAppJobStatus } from '@/src/domain/notifications/whatsapp-queue-service';
import { getSessionFromRequest } from '@/src/lib/session';
import { logAudit } from '@/src/domain/audit/audit-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.roleId !== 'administrator') {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const statusParam = searchParams.get('status') || 'pending';

    const validStatuses: (WhatsAppJobStatus | 'all')[] = ['all', 'pending', 'sent', 'failed'];
    const status = validStatuses.includes(statusParam as WhatsAppJobStatus | 'all')
      ? (statusParam as WhatsAppJobStatus | 'all')
      : 'pending';

    const jobs = status === 'pending'
      ? await getPendingWhatsAppMessages(limit)
      : await getWhatsAppJobsByStatus(status, limit);

    const totalPending = await countPendingWhatsAppMessages();

    return NextResponse.json({ jobs, totalPending, currentFilter: status });
  } catch (error) {
    console.error('Error fetching WhatsApp jobs:', error);
    return NextResponse.json({ error: 'Failed to fetch WhatsApp jobs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.roleId !== 'administrator') {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const body = await request.json();
    const { jobId, status, error } = body;

    if (body.action === 'process') {
      const processed = await processPendingWhatsAppMessages(10);
      if (processed > 0) {
        await logAudit(session.uid, session.roleId, 'manage', 'task', 'whatsapp-jobs', 'success', {
          processed,
        });
      }
      return NextResponse.json({ processed, success: true });
    }

    if (!jobId || !status) {
      return NextResponse.json({ error: 'jobId and status are required' }, { status: 400 });
    }

    await updateWhatsAppJobStatus(jobId, status, error);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing WhatsApp jobs:', error);
    return NextResponse.json({ error: 'Failed to process WhatsApp jobs' }, { status: 500 });
  }
}
