// Attachments Route Handler (T050)
// API endpoints for uploading and managing task attachments

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createAttachmentMetadata, getTaskAttachments, deleteAttachment, getDownloadUrl, StorageNotAvailableError } from '@/src/domain/attachments/attachment-service';
import { getSessionUser } from '@/src/domain/auth/auth-service';
import { assertCan } from '@/src/domain/rbac/rbac-service';
import { adminStorage, isStorageAvailable } from '@/src/firebase/admin';
import { randomUUID } from 'crypto';

/**
 * GET /api/tasks/[taskId]/attachments
 * List all attachments for a task
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { taskId: string } }
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

    const attachments = await getTaskAttachments(params.taskId);
    
    // Try to add download URLs, gracefully handle if storage not available
    let attachmentsWithUrls;
    try {
      attachmentsWithUrls = await Promise.all(
        attachments.map(async (att) => ({
          ...att,
          downloadUrl: await getDownloadUrl(params.taskId, att.id),
        }))
      );
    } catch {
      attachmentsWithUrls = attachments;
    }

    return NextResponse.json(attachmentsWithUrls);
  } catch (error) {
    console.error('Error fetching attachments:', error);
    return NextResponse.json({ error: 'Failed to fetch attachments' }, { status: 500 });
  }
}

/**
 * POST /api/tasks/[taskId]/attachments
 * Upload a new attachment to a task
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { taskId: string } }
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

    assertCan(session, 'edit', 'task');

    if (!isStorageAvailable()) {
      return NextResponse.json(
        { error: 'Armazenamento de arquivos não configurado. Anexos indisponíveis.' },
        { status: 501 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    const attachmentId = randomUUID();
    const storagePath = `tasks/${params.taskId}/attachments/${attachmentId}`;
    
    // Upload to Cloud Storage
    const buffer = await file.arrayBuffer();
    await adminStorage.bucket().file(storagePath).save(Buffer.from(buffer), {
      metadata: {
        contentType: file.type,
      },
    });

    // Create metadata record
    const attachment = await createAttachmentMetadata(
      params.taskId,
      attachmentId,
      file.name,
      file.size,
      file.type,
      session
    );

    const downloadUrl = await getDownloadUrl(params.taskId, attachmentId);

    return NextResponse.json(
      { ...attachment, downloadUrl },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error uploading attachment:', error);
    if ((error as any).message?.includes('permission')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to upload attachment' }, { status: 500 });
  }
}

/**
 * DELETE /api/tasks/[taskId]/attachments/[attachmentId]
 * Delete an attachment
 */
export async function DELETE(
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

    assertCan(session, 'delete', 'attachment');

    await deleteAttachment(params.taskId, params.attachmentId, session);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting attachment:', error);
    return NextResponse.json({ error: 'Failed to delete attachment' }, { status: 500 });
  }
}
