import { NextResponse } from 'next/server';
import { runInactivityCheck } from '@/src/domain/notifications/inactivity-service';

export async function POST(request: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get('authorization')?.replace('Bearer ', '');

    if (cronSecret && authHeader !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await runInactivityCheck();

    return NextResponse.json({
      ...result,
      success: true,
    });
  } catch (error) {
    console.error('Inactivity check failed:', error);
    return NextResponse.json({ error: 'Inactivity check failed' }, { status: 500 });
  }
}
