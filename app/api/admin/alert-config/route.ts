import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/src/lib/session';
import {
  getAllAlertConfigs,
  updateAlertConfig,
  getConfigurableEvents,
  getConfigurableStages,
} from '@/src/domain/notifications/alert-config-service';
import { logAudit } from '@/src/domain/audit/audit-service';
import type { RoleId } from '@/src/types/domain';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.roleId !== 'administrator') {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }

    const configs = await getAllAlertConfigs();
    const eventTypes = getConfigurableEvents();
    const stageIds = getConfigurableStages();

    return NextResponse.json({ configs, eventTypes, stageIds });
  } catch (error) {
    console.error('Error fetching alert configs:', error);
    return NextResponse.json({ error: 'Failed to fetch alert configs' }, { status: 500 });
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
    const { configId, enabled, notifyResponsible, notifyCreator, notifyParticipants, notifyRoles } = body;

    if (!configId) {
      return NextResponse.json({ error: 'configId is required' }, { status: 422 });
    }

    const validRoles: RoleId[] = ['administrator', 'coordinator', 'collaborator', 'internal_reader'];
    const filteredRoles = Array.isArray(notifyRoles)
      ? notifyRoles.filter((r: string) => validRoles.includes(r as RoleId))
      : undefined;

    await updateAlertConfig(configId, {
      ...(typeof enabled === 'boolean' && { enabled }),
      ...(typeof notifyResponsible === 'boolean' && { notifyResponsible }),
      ...(typeof notifyCreator === 'boolean' && { notifyCreator }),
      ...(typeof notifyParticipants === 'boolean' && { notifyParticipants }),
      ...(filteredRoles !== undefined && { notifyRoles: filteredRoles }),
      updatedBy: session.uid,
    });

    await logAudit(session.uid, session.roleId, 'manage', 'alertconfig', configId, 'success', {
      action: 'update_alert_config',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating alert config:', error);
    return NextResponse.json({ error: 'Failed to update alert config' }, { status: 500 });
  }
}
