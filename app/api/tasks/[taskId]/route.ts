import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getTask, updateTask } from '@/src/domain/tasks/task-service';
import { getSessionFromRequest } from '@/src/lib/session';
import { getTaskHistory } from '@/src/domain/history/history-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const task = await getTask(taskId);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const history = await getTaskHistory(taskId);
    return NextResponse.json({ ...task, history });
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const task = await updateTask(taskId, body, session);

    return NextResponse.json(task);
  } catch (error: any) {
    console.error('Error updating task:', error);
    if (error?.message?.includes('cannot')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }
    if (error?.message?.includes('not found')) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}
