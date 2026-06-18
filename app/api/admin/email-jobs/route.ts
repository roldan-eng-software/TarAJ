import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getPendingEmails, updateEmailJobStatus, countPendingEmails } from '@/src/domain/notifications/email-queue-service';
import { getSessionUser } from '@/src/domain/auth/auth-service';
import { assertCan } from '@/src/domain/rbac/rbac-service';

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

    assertCan(session, 'manage', 'user');

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

    assertCan(session, 'manage', 'user');

    const body = await request.json();
    const { jobId, status, error } = body;

    if (!jobId || !status) {
      return NextResponse.json({ error: 'jobId and status are required' }, { status: 400 });
    }

    await updateEmailJobStatus(jobId, status, error);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating email job:', error);
    return NextResponse.json({ error: 'Failed to update email job' }, { status: 500 });
  }
}
