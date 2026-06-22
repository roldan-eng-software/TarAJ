import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/src/lib/session';
import { getAuditLogs } from '@/src/domain/audit/audit-service';
import { assertCan } from '@/src/domain/rbac/rbac-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    assertCan(session, 'view', 'audit');

    const { searchParams } = new URL(request.url);
    const resourceType = searchParams.get('resourceType') || undefined;
    const resourceId = searchParams.get('resourceId') || undefined;
    const limit = parseInt(searchParams.get('limit') || '100');

    const logs = await getAuditLogs(
      resourceType as any,
      resourceId,
      Math.min(limit, 500)
    );

    return NextResponse.json({ logs });
  } catch (error: any) {
    if (error?.message?.includes('denied') || error?.message?.includes('cannot')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    console.error('Error fetching audit logs:', error);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}
