import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAttachment, getDownloadUrl } from '@/src/domain/attachments/attachment-service';
import { getSessionUser } from '@/src/domain/auth/auth-service';
import { assertCan } from '@/src/domain/rbac/rbac-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string; attachmentId: string } }
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

    assertCan(session, 'view', 'task');

    const attachment = await getAttachment(params.taskId, params.attachmentId);
    if (!attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
    }

    const downloadUrl = await getDownloadUrl(params.taskId, params.attachmentId);

    return NextResponse.json({ downloadUrl, attachment });
  } catch (error) {
    console.error('Error getting attachment download:', error);
    return NextResponse.json({ error: 'Failed to get download URL' }, { status: 500 });
  }
}
