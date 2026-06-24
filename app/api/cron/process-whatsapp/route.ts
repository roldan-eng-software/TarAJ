import { NextResponse } from 'next/server';
import {
  processPendingWhatsAppMessages,
  cleanupOldWhatsAppJobs,
} from '@/src/domain/notifications/whatsapp-queue-service';

export async function GET(request: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get('authorization')?.replace('Bearer ', '');

    if (cronSecret && authHeader !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const processed = await processPendingWhatsAppMessages(50);
    const cleaned = await cleanupOldWhatsAppJobs(30);

    return NextResponse.json({
      processed,
      cleaned,
      success: true,
    });
  } catch (error) {
    console.error('Cron WhatsApp processing failed:', error);
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

    const processed = await processPendingWhatsAppMessages(limit);

    return NextResponse.json({
      processed,
      success: true,
    });
  } catch (error) {
    console.error('Cron WhatsApp processing failed:', error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
