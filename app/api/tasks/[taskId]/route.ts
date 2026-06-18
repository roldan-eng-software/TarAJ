// Task Detail API Route Handler (T037)
// Get task detail and update task with side effects

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getTask, updateTask } from '@/src/domain/tasks/task-service';
import { getTaskHistory } from '@/src/domain/history/history-service';
import { getSessionUser } from '@/src/domain/auth/auth-service';
import { assertCan } from '@/src/domain/rbac/rbac-service';
import { logAudit } from '@/src/domain/audit/audit-service';
import { validateTaskUpdate } from '@/src/domain/tasks/task-validation';

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

    const task = await getTask(taskId);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const history = await getTaskHistory(taskId);

    return NextResponse.json({ ...task, history });
  } catch (error: any) {
    console.error('Error fetching task:', error);
    if (error?.message?.includes('cannot')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 });
  }
}

export async function PATCH(
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

    const body = await request.json();

    let validated;
    try {
      validated = validateTaskUpdate(body);
    } catch (validationError: any) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationError?.issues || validationError?.message },
        { status: 422 }
      );
    }

    const updated = await updateTask(taskId, validated, session);

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Error updating task:', error);
    if (error?.message?.includes('cannot') || error?.message?.includes('permission')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }
    if (error?.message?.includes('not found')) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}
