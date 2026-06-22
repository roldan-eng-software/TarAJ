import { NextResponse } from 'next/server';
import { deleteOldAlerts } from '@/src/domain/notifications/notification-service';
import { cleanupOldEmailJobs } from '@/src/domain/notifications/email-queue-service';

export async function POST(request: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get('authorization')?.replace('Bearer ', '');

    if (cronSecret && authHeader !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const deletedAlerts = await deleteOldAlerts(30);
    const deletedEmailJobs = await cleanupOldEmailJobs(30);

    return NextResponse.json({
      deletedAlerts,
      deletedEmailJobs,
      success: true,
    });
  } catch (error) {
    console.error('Cleanup failed:', error);
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
  }
}
