import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { markAlertAsRead } from '@/src/domain/notifications/notification-service';
import { getSessionFromRequest } from '@/src/lib/session';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ alertId: string }> }
) {
  try {
    const { alertId } = await params;
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await markAlertAsRead(alertId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking alert as read:', error);
    return NextResponse.json({ error: 'Failed to mark alert as read' }, { status: 500 });
  }
}
