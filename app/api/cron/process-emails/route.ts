import { NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json({ success: true, message: 'Health check ok' });
  } catch (error) {
    return NextResponse.json({
      error: 'Processing failed',
      detail: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
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
    return NextResponse.json({ success: true, limit: body.limit || 50 });
  } catch (error) {
    return NextResponse.json({
      error: 'Processing failed',
      detail: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
