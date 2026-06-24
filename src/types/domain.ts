// Domain Types
// Shared type definitions for users, roles, permissions, tasks, workflow, history, alerts, etc.

export type RoleId = 'administrator' | 'coordinator' | 'collaborator' | 'internal_reader';

export type PermissionAction =
  | 'view'
  | 'create'
  | 'edit'
  | 'delete'
  | 'move'
  | 'comment'
  | 'attach'
  | 'archive'
  | 'restore'
  | 'manage';

export type ResourceType = 'task' | 'user' | 'audit' | 'attachment' | 'alert' | 'alertconfig' | 'comment';

export interface Permission {
  role: RoleId;
  action: PermissionAction;
  resource: ResourceType;
}

export interface User {
  id: string;
  displayName: string;
  email: string;
  roleId: RoleId;
  status: 'active' | 'disabled';
  permissions?: PermissionAction[];
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
}

export interface Role {
  id: RoleId;
  name: string;
  label: string;
  description: string;
  permissions: PermissionAction[];
  active: boolean;
}

export type StageId =
  | 'entrada'
  | 'analise'
  | 'aguardando_docs'
  | 'andamento'
  | 'revisao'
  | 'concluida'
  | 'arquivada';

export interface WorkflowStage {
  id: StageId;
  name: string;
  order: number;
  isArchived: boolean;
}

export interface Task {
  id: string;
  referenceCode: string;
  title: string;
  description: string;
  category: string;
  priority: 'baixa' | 'normal' | 'alta' | 'crítica';
  stageId: StageId;
  responsibleUserId: string;
  participantIds: string[];
  dueDate?: Date;
  confidentialityLevel: 'interno' | 'restrito' | 'público';
  internalNotes?: string;
  archived: boolean;
  archivedAt?: Date;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
  completedAt?: Date;
  lastActivityAt?: Date;
}

export type HistoryEventType =
  | 'created'
  | 'stage_changed'
  | 'responsible_changed'
  | 'comment_added'
  | 'attachment_added'
  | 'completed'
  | 'archived'
  | 'restored'
  | 'updated';

export interface TaskHistory {
  id: string;
  taskId: string;
  eventType: HistoryEventType;
  actor: string;
  actorRole: RoleId;
  previousValue?: unknown;
  newValue?: unknown;
  metadata?: Record<string, unknown>;
  occurredAt: Date;
}

export interface Comment {
  id: string;
  taskId: string;
  text: string;
  mentions: string[];
  createdBy: string;
  createdAt: Date;
}

export interface Attachment {
  id: string;
  taskId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  createdBy: string;
  createdAt: Date;
}

export type AlertEventType =
  | 'task_created'
  | 'task_assigned'
  | 'responsible_changed'
  | 'stage_changed'
  | 'stage_moved_backward'
  | 'due_upcoming'
  | 'due_overdue'
  | 'task_completed'
  | 'task_archived'
  | 'task_restored'
  | 'mentioned'
  | 'mentioned_in_comment'
  | 'backward_move'
  | 'inactivity_alert';

export interface Alert {
  id: string;
  taskId: string;
  eventType: string;
  recipientId: string;
  actorName: string;
  message: string;
  actionUrl?: string;
  readAt: Date | null;
  createdAt: Date;
  dedupeKey: string;
  metadata?: Record<string, unknown>;
}

export interface AuditLog {
  id: string;
  actor: string;
  actorRole: RoleId;
  action: PermissionAction;
  resourceType: ResourceType;
  resourceId: string;
  result: 'success' | 'denied' | 'failed';
  metadata?: Record<string, unknown>;
  previousValue?: unknown;
  newValue?: unknown;
  occurredAt: Date;
  requestId: string;
}

export interface SessionUser {
  uid: string;
  email: string;
  displayName: string;
  roleId: RoleId;
  permissions: PermissionAction[];
}

export interface CreateTaskInput {
  title: string;
  description: string;
  category: string;
  priority: Task['priority'];
  responsibleUserId: string;
  participantIds: string[];
  dueDate?: string | Date;
  confidentialityLevel: Task['confidentialityLevel'];
  internalNotes?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  priority?: Task['priority'];
  responsibleUserId?: string;
  participantIds?: string[];
  dueDate?: string | Date;
  confidentialityLevel?: Task['confidentialityLevel'];
  internalNotes?: string;
}

export interface TransitionInput {
  taskId: string;
  toStageId: StageId;
  comment?: string;
}

export interface StageAlertConfig {
  id: string;
  stageId: StageId;
  eventType: AlertEventType;
  enabled: boolean;
  notifyResponsible: boolean;
  notifyCreator: boolean;
  notifyParticipants: boolean;
  notifyRoles: RoleId[];
  updatedAt: Date;
  updatedBy: string;
}

export interface TaskCategory {
  id: string;
  name: string;
  slug: string;
  order: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailJob {
  id: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  body: string;
  htmlBody?: string;
  metadata?: Record<string, unknown>;
  status: 'pending' | 'sent' | 'failed' | 'bounced';
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  sentAt: Date | null;
  error: string | null;
}
