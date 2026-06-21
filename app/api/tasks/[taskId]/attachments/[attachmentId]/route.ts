import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAttachment, getDownloadUrl } from '@/src/domain/attachments/attachment-service';
import { getSessionUser } from '@/src/domain/auth/auth-service';
import { assertCanAccessTask } from '@/src/domain/rbac/rbac-service';
import { getTask } from '@/src/domain/tasks/task-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string; attachmentId: string }> }
) {
  try {
    const { taskId, attachmentId } = await params;
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSessionUser(token);
    if (!session) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const task = await getTask(taskId);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    assertCanAccessTask(session, task, 'view');

    const attachment = await getAttachment(taskId, attachmentId);
    if (!attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
    }

    const downloadUrl = await getDownloadUrl(taskId, attachmentId);

    return NextResponse.json({ ...attachment, downloadUrl });
  } catch (error) {
    console.error('Error fetching attachment:', error);
    return NextResponse.json({ error: 'Failed to fetch attachment' }, { status: 500 });
  }
}
