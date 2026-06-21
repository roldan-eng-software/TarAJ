import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  getTaskAttachments,
  uploadAttachment,
} from '@/src/domain/attachments/attachment-service';
import { getSessionUser } from '@/src/domain/auth/auth-service';
import { assertCanAccessTask } from '@/src/domain/rbac/rbac-service';
import { getTask } from '@/src/domain/tasks/task-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
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

    const attachments = await getTaskAttachments(taskId);
    return NextResponse.json(attachments);
  } catch (error) {
    console.error('Error fetching attachments:', error);
    return NextResponse.json({ error: 'Failed to fetch attachments' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
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

    assertCanAccessTask(session, task, 'attach');

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 422 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const attachmentId = `att_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const attachment = await uploadAttachment(
      taskId,
      attachmentId,
      file.name,
      buffer,
      file.type,
      session
    );

    return NextResponse.json(attachment, { status: 201 });
  } catch (error: any) {
    console.error('Error uploading attachment:', error);
    if (error?.message?.includes('cannot')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to upload attachment' }, { status: 500 });
  }
}
