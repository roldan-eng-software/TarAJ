import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/src/lib/session';
import { getWhatsAppConfig, updateWhatsAppConfig } from '@/src/domain/notifications/whatsapp-config';
import { logAudit } from '@/src/domain/audit/audit-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.roleId !== 'administrator') {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const config = await getWhatsAppConfig();
    return NextResponse.json({ config });
  } catch (error) {
    console.error('Error fetching WhatsApp config:', error);
    return NextResponse.json({ error: 'Failed to fetch config' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.roleId !== 'administrator') {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const body = await request.json();
    const { enabled, apiUrl, apiKey } = body;

    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'enabled must be a boolean' }, { status: 422 });
    }

    if (typeof apiUrl !== 'string') {
      return NextResponse.json({ error: 'apiUrl must be a string' }, { status: 422 });
    }

    await updateWhatsAppConfig(enabled, apiUrl, apiKey, session.uid);

    await logAudit(session.uid, session.roleId, 'manage', 'alertconfig', 'whatsapp', 'success', {
      action: 'update_whatsapp_config',
      enabled,
      apiUrl,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating WhatsApp config:', error);
    return NextResponse.json({ error: 'Failed to update config' }, { status: 500 });
  }
}
