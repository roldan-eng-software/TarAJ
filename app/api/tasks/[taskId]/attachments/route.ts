import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { uploadAttachment, getTaskAttachments } from '@/src/domain/attachments/attachment-service';
import { getSessionUser } from '@/src/domain/auth/auth-service';
import { assertCan } from '@/src/domain/rbac/rbac-service';
import { randomUUID } from 'crypto';

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

    assertCan(session, 'view', 'task');

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

    assertCan(session, 'edit', 'task');

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    const attachmentId = randomUUID();
    const buffer = Buffer.from(await file.arrayBuffer());

    const attachment = await uploadAttachment(
      taskId,
      attachmentId,
      file.name,
      buffer,
      file.type,
      session
    );

    return NextResponse.json(attachment, { status: 201 });
  } catch (error) {
    console.error('Error uploading attachment:', error);
    if ((error as any).message?.includes('permission')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to upload attachment' }, { status: 500 });
  }
}
