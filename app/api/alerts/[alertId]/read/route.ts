import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { markAlertAsRead } from '@/src/domain/notifications/notification-service';
import { getSessionUser } from '@/src/domain/auth/auth-service';

export async function POST(
  request: NextRequest,
  { params }: { params: { alertId: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSessionUser(token);
    if (!session) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    await markAlertAsRead(params.alertId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking alert as read:', error);
    return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 });
  }
}
