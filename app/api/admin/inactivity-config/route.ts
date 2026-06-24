import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/src/lib/session';
import { getInactivityConfig, updateInactivityConfig } from '@/src/domain/notifications/inactivity-config';
import { logAudit } from '@/src/domain/audit/audit-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.roleId !== 'administrator' && session.roleId !== 'coordinator') {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const config = await getInactivityConfig();
    return NextResponse.json({ config });
  } catch (error) {
    console.error('Error fetching inactivity config:', error);
    return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.roleId !== 'administrator' && session.roleId !== 'coordinator') {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const body = await request.json();
    const { daysThreshold, enabled } = body;

    if (typeof daysThreshold !== 'number' || daysThreshold < 1 || daysThreshold > 365) {
      return NextResponse.json({ error: 'daysThreshold must be between 1 and 365' }, { status: 422 });
    }

    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'enabled must be a boolean' }, { status: 422 });
    }

    await updateInactivityConfig(daysThreshold, enabled, session.uid);

    await logAudit(session.uid, session.roleId, 'manage', 'alertconfig', 'inactivity', 'success', {
      action: 'update_inactivity_config',
      daysThreshold,
      enabled,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating inactivity config:', error);
    return NextResponse.json({ error: 'Failed to update config' }, { status: 500 });
  }
}
