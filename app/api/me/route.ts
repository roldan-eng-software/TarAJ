import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { adminDb } from '@/src/firebase/admin';
import { getSessionFromRequest } from '@/src/lib/session';

const VALID_EVENT_TYPES = [
  'task_created', 'task_assigned', 'stage_changed', 'responsible_changed',
  'mentioned', 'task_completed', 'task_archived', 'backward_move',
  'due_upcoming', 'due_overdue', 'task_restored',
];

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const doc = await adminDb.collection('users').doc(session.uid).get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const data = doc.data()!;
    const prefsSnap = await adminDb.collection('notificationPreferences').doc(session.uid).get();
    const prefs = prefsSnap.exists ? prefsSnap.data() : null;

    return NextResponse.json({
      id: doc.id,
      displayName: data.displayName,
      email: data.email,
      roleId: data.roleId,
      lastLoginAt: data.lastLoginAt?.toDate?.()?.toISOString() || null,
      notificationPrefs: prefs || null,
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { displayName } = body;

    if (!displayName || typeof displayName !== 'string' || displayName.trim().length < 2) {
      return NextResponse.json({ error: 'Nome deve ter pelo menos 2 caracteres' }, { status: 422 });
    }

    const trimmedName = displayName.trim();

    await adminDb.collection('users').doc(session.uid).update({
      displayName: trimmedName,
      updatedAt: new Date(),
      updatedBy: session.uid,
    });

    return NextResponse.json({ success: true, displayName: trimmedName });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    if (body.notificationPrefs) {
      const { emailNotifications, enabledEvents } = body.notificationPrefs;

      const prefs: Record<string, unknown> = {
        userId: session.uid,
        updatedAt: new Date(),
      };

      if (typeof emailNotifications === 'boolean') {
        prefs.emailNotifications = emailNotifications;
      }

      if (Array.isArray(enabledEvents)) {
        const filtered = enabledEvents.filter((e: string) => VALID_EVENT_TYPES.includes(e));
        prefs.enabledEvents = filtered;
      }

      await adminDb.collection('notificationPreferences').doc(session.uid).set(prefs, { merge: true });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid request body' }, { status: 422 });
  } catch (error) {
    console.error('Error updating preferences:', error);
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
  }
}
