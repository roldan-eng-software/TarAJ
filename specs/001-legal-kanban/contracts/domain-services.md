# Domain Service Contracts

Domain services are the only modules allowed to apply critical business rules.
Route Handlers may validate request shape and authentication, but must delegate
workflow, RBAC, audit, history and notification side effects to services.

## Common Context

```ts
type ActorContext = {
  userId: string
  roleId: string
  permissions: string[]
  requestId: string
}
```

All mutating services receive `ActorContext`.

## authService

- `verifyRequestSession(request): Promise<ActorContext | null>`
- `loadUserProfile(userId): Promise<UserProfile>`

Rules:

- Reject disabled users.
- Never trust role values sent by the client.

## rbacService

- `assertCan(actor, action, resource, scope): void`
- `can(actor, action, resource, scope): boolean`

Core actions:

- `task:create`
- `task:read`
- `task:update`
- `task:move`
- `task:comment`
- `task:attach`
- `task:archive`
- `task:restore`
- `alert:read`
- `audit:read`
- `user:manage`

Rules:

- Administrator can manage users and read full audit.
- Coordinator can manage operational tasks in allowed scope.
- Collaborator can act on assigned/participating tasks as allowed.
- Internal Reader is read-only.

## taskService

- `createTask(actor, input): Promise<Task>`
- `updateTask(actor, taskId, patch): Promise<Task>`
- `getTask(actor, taskId): Promise<TaskDetail>`
- `listTasks(actor, filters): Promise<TaskSummary[]>`

Side effects:

- `createTask` writes history, audit and alerts.
- `updateTask` detects responsible changes and writes history/audit/alerts.

## workflowService

- `transitionTask(actor, taskId, targetStageId, comment?): Promise<Task>`
- `archiveTask(actor, taskId, reason?): Promise<Task>`
- `restoreTask(actor, taskId, targetStageId, reason): Promise<Task>`

Rules:

- Validate permission before state change.
- Validate transition from current stage to target stage.
- Require comment when stage configuration demands it.
- Detect backward transition and emit specific history/alert event.
- Archive only completed tasks unless administrative closure is authorized.

## historyService

- `appendTaskHistory(actor, taskId, event): Promise<HistoryEvent>`
- `listTaskHistory(actor, taskId): Promise<HistoryEvent[]>`

Rules:

- Append-only.
- Event summary must be understandable by non-technical users.

## auditService

- `record(actorOrPartial, event): Promise<AuditLog>`
- `recordDenied(actorOrPartial, event): Promise<AuditLog>`
- `query(actor, filters): Promise<AuditLog[]>`

Rules:

- Append-only.
- Include requestId for correlation.
- Must not expose sensitive metadata to unauthorized readers.

## commentService

- `addComment(actor, taskId, input): Promise<Comment>`
- `listComments(actor, taskId): Promise<Comment[]>`

Side effects:

- history event
- audit log
- mention alerts for mentioned users with access to the task

## attachmentService

- `createUploadIntent(actor, taskId, file): Promise<UploadIntent>`
- `completeUpload(actor, taskId, attachmentId): Promise<Attachment>`
- `getDownloadAccess(actor, taskId, attachmentId): Promise<DownloadAccess>`

Rules:

- Actor must have task access.
- Storage path must be task-scoped.
- Metadata must exist before download access is granted.

## notificationService

- `emitTaskEvent(actor, event): Promise<Alert[]>`
- `markRead(actor, alertId): Promise<void>`
- `queueEmail(alert): Promise<EmailJob | null>`

Rules:

- Internal alert is always the source of truth.
- Deduplicate by `dedupeKey`.
- E-mail failure must update email status without deleting alert.

## dueDateService

- `scanUpcomingDueDates(now): Promise<void>`
- `scanOverdueTasks(now): Promise<void>`

Rules:

- Generate alerts only when due status changes or configured threshold is met.
- Do not spam repeated reminders for same recipient/task/status.
