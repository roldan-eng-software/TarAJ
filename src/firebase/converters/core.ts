import type { Task, User, Alert, AuditLog, RoleId, StageId } from '@/src/types/domain';

type FirestoreTimestamp = { toDate: () => Date; seconds: number; nanoseconds: number };

function parseDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    return (value as FirestoreTimestamp).toDate();
  }
  return undefined;
}

export function taskFromFirestore(id: string, data: Record<string, unknown>): Task {
  return {
    id,
    referenceCode: data.referenceCode as string,
    title: data.title as string,
    description: data.description as string,
    category: data.category as string,
    priority: data.priority as Task['priority'],
    stageId: data.stageId as StageId,
    responsibleUserId: data.responsibleUserId as string,
    participantIds: (data.participantIds as string[]) || [],
    dueDate: parseDate(data.dueDate),
    confidentialityLevel: data.confidentialityLevel as Task['confidentialityLevel'],
    internalNotes: data.internalNotes as string | undefined,
    archived: (data.archived as boolean) || false,
    archivedAt: parseDate(data.archivedAt),
    createdAt: parseDate(data.createdAt) || new Date(),
    createdBy: data.createdBy as string,
    updatedAt: parseDate(data.updatedAt) || new Date(),
    updatedBy: data.updatedBy as string,
    completedAt: parseDate(data.completedAt),
  };
}

export function taskToFirestore(task: Partial<Task>): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  const fields: (keyof Task)[] = [
    'referenceCode', 'title', 'description', 'category', 'priority',
    'stageId', 'responsibleUserId', 'participantIds', 'confidentialityLevel',
    'internalNotes', 'archived', 'createdBy', 'updatedBy',
  ];
  for (const field of fields) {
    if (field in task) data[field] = task[field];
  }
  if (task.dueDate) data.dueDate = task.dueDate;
  if (task.createdAt) data.createdAt = task.createdAt;
  if (task.updatedAt) data.updatedAt = task.updatedAt;
  if (task.archivedAt) data.archivedAt = task.archivedAt;
  if (task.completedAt) data.completedAt = task.completedAt;
  return data;
}

export function userFromFirestore(id: string, data: Record<string, unknown>): User {
  return {
    id,
    displayName: data.displayName as string,
    email: data.email as string,
    roleId: data.roleId as RoleId,
    status: (data.status as User['status']) || 'active',
    permissions: data.permissions as User['permissions'],
    createdAt: parseDate(data.createdAt) || new Date(),
    createdBy: data.createdBy as string,
    updatedAt: parseDate(data.updatedAt) || new Date(),
    updatedBy: data.updatedBy as string,
  };
}

export function alertFromFirestore(id: string, data: Record<string, unknown>): Alert {
  return {
    id,
    taskId: data.taskId as string,
    eventType: data.eventType as string,
    recipientId: data.recipientId as string,
    actorName: data.actorName as string,
    message: data.message as string,
    actionUrl: data.actionUrl as string | undefined,
    readAt: parseDate(data.readAt) ?? null,
    createdAt: parseDate(data.createdAt) || new Date(),
    dedupeKey: data.dedupeKey as string,
    metadata: data.metadata as Record<string, unknown> | undefined,
  };
}

export function auditLogFromFirestore(id: string, data: Record<string, unknown>): AuditLog {
  return {
    id,
    actor: data.actor as string,
    actorRole: data.actorRole as RoleId,
    action: data.action as AuditLog['action'],
    resourceType: data.resourceType as AuditLog['resourceType'],
    resourceId: data.resourceId as string,
    result: data.result as AuditLog['result'],
    metadata: data.metadata as Record<string, unknown> | undefined,
    previousValue: data.previousValue,
    newValue: data.newValue,
    occurredAt: parseDate(data.occurredAt) || new Date(),
    requestId: data.requestId as string,
  };
}
