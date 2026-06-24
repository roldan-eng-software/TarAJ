import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/src/lib/session';
import { seedDefaultAlertConfigs } from '@/src/domain/notifications/alert-config-service';
import { logAudit } from '@/src/domain/audit/audit-service';

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.roleId !== 'administrator') {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const count = await seedDefaultAlertConfigs(session.uid);

    await logAudit(session.uid, session.roleId, 'manage', 'alertconfig', 'bulk', 'success', {
      action: 'seed_alert_configs',
      count,
    });

    return NextResponse.json({ success: true, seeded: count });
  } catch (error) {
    console.error('Error seeding alert configs:', error);
    return NextResponse.json({ error: 'Failed to seed alert configs' }, { status: 500 });
  }
}
