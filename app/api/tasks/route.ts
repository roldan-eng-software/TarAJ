// Tasks API Route Handler (T037)
// List, create, and search tasks with RBAC and side effects

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createTask, listTasks, searchTasks } from '@/src/domain/tasks/task-service';
import { getSessionFromRequest } from '@/src/lib/session';

import { validateTaskCreation } from '@/src/domain/tasks/task-validation';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const archived = searchParams.get('archived');
    const stageId = searchParams.get('stageId');
    const responsibleUserId = searchParams.get('responsibleUserId');
    const priority = searchParams.get('priority');
    const category = searchParams.get('category');
    const confidentialityLevel = searchParams.get('confidentialityLevel');
    const dueDateStatus = searchParams.get('dueDateStatus') as 'upcoming' | 'overdue' | null;
    const q = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (q) {
      const tasks = await searchTasks(
        q,
        archived === 'true' ? true : archived === 'false' ? false : undefined,
        limit
      );
      return NextResponse.json({ tasks });
    }

    const filters: Record<string, unknown> = {};
    if (archived === 'true') filters.archived = true;
    if (archived === 'false') filters.archived = false;
    if (stageId) filters.stageId = stageId;
    if (responsibleUserId) filters.responsibleUserId = responsibleUserId;
    if (priority) filters.priority = priority;
    if (category) filters.category = category;
    if (confidentialityLevel) filters.confidentialityLevel = confidentialityLevel;
    if (dueDateStatus) filters.dueDateStatus = dueDateStatus;

    const tasks = await listTasks(filters as any, limit);

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Error listing tasks:', error);
    return NextResponse.json({ error: 'Failed to list tasks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    let validated;
    try {
      validated = validateTaskCreation(body);
    } catch (validationError: any) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationError?.issues || validationError?.message },
        { status: 422 }
      );
    }

    const task = await createTask(validated, session);

    return NextResponse.json(task, { status: 201 });
  } catch (error: any) {
    console.error('Error creating task:', error);
    if (error?.message?.includes('cannot')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
