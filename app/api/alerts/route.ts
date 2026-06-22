import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  getUserAlerts,
  getUserUnreadAlerts,
  markAllAlertsAsRead,
} from '@/src/domain/notifications/notification-service';
import { getSessionFromRequest } from '@/src/lib/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const alerts = unreadOnly
      ? await getUserUnreadAlerts(session.uid, limit)
      : await getUserAlerts(session.uid, limit, offset);

    return NextResponse.json(alerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const count = await markAllAlertsAsRead(session.uid);

    return NextResponse.json({ count, success: true });
  } catch (error) {
    console.error('Error marking all alerts as read:', error);
    return NextResponse.json({ error: 'Failed to update alerts' }, { status: 500 });
  }
}
