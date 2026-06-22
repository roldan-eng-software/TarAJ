import { NextResponse } from 'next/server';
import {
  processPendingEmails,
  cleanupOldEmailJobs,
} from '@/src/domain/notifications/email-queue-service';

export async function GET(request: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get('authorization')?.replace('Bearer ', '');

    if (cronSecret && authHeader !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const processed = await processPendingEmails(50);
    const cleaned = await cleanupOldEmailJobs(30);

    return NextResponse.json({
      processed,
      cleaned,
      success: true,
    });
  } catch (error) {
    console.error('Cron email processing failed:', error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get('authorization')?.replace('Bearer ', '');

    if (cronSecret && authHeader !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const limit = body.limit || 50;

    const processed = await processPendingEmails(limit);

    return NextResponse.json({
      processed,
      success: true,
    });
  } catch (error) {
    console.error('Cron email processing failed:', error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
