import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { adminDb } from '@/src/firebase/admin';
import { getSessionFromRequest } from '@/src/lib/session';
import { assertCan } from '@/src/domain/rbac/rbac-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    assertCan(session, 'view', 'audit');

    const now = new Date();

    const [activeTasksSnap, overdueSnap, unreadSnap, usersSnap] = await Promise.all([
      adminDb.collection('tasks').where('archived', '==', false).get(),
      adminDb.collection('tasks')
        .where('archived', '==', false)
        .where('dueDate', '<', now)
        .get(),
      adminDb.collection('alerts').where('readAt', '==', null).get(),
      adminDb.collection('users').where('status', '==', 'active').get(),
    ]);

    const overdueTasks = overdueSnap.docs.filter((d) => !d.data().completedAt).length;

    return NextResponse.json({
      activeTasks: activeTasksSnap.docs.length,
      overdueTasks,
      unreadAlerts: unreadSnap.docs.length,
      activeUsers: usersSnap.docs.length,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 });
  }
}
