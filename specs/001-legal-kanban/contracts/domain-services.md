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

- `getSessionUser(authorizationHeader): Promise<SessionUser | null>`
- `createUser(data): Promise<User>`
- `disableUser(userId): Promise<void>`

Rules:

- Reject disabled users.
- Never trust role values sent by the client.

## rbacService

- `assertCan(actor, action, resource, scope?): void`
- `can(actor, action, resource, scope?): boolean`
- `canAccessTask(actor, task): boolean`
- `assertCanAccessTask(actor, task): void`
- `hasPermission(role, action, resource): boolean`
- `getPermissionsForRole(role): PermissionAction[]`

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
- `deleteTask(actor, taskId): Promise<void>`
- `searchTasks(actor, query): Promise<TaskSummary[]>`

Side effects:

- `createTask` writes history, audit and alerts.
- `updateTask` detects responsible changes and writes history/audit/alerts.

## workflowService

- `isValidTransition(fromStage, toStage): boolean`
- `isBackwardTransition(fromStage, toStage): boolean`
- `getAllowedTransitions(stageId): StageId[]`
- `validateTransition(task, targetStageId): void`
- `canComplete(task): boolean`
- `canArchive(task): boolean`
- `canRestore(task): boolean`
- `getStageName(stageId): string`

Rules:

- Validate permission before state change.
- Validate transition from current stage to target stage.
- Detect backward transition and emit specific history/alert event.
- Archive only completed tasks unless administrative closure is authorized.

Note: Task transitions (move, archive, restore) are orchestrated by Route
Handlers (`/api/tasks/{taskId}/transitions`, `/api/tasks/{taskId}/archive`,
`/api/tasks/{taskId}/restore`) which call `workflowService` for validation
before performing the mutation and side effects.

## historyService

- `recordHistoryEvent(actor, taskId, event): Promise<HistoryEvent>`
- `getTaskHistory(actor, taskId): Promise<HistoryEvent[]>`
- `recordTaskCreation(actor, taskId, data): Promise<void>`
- `recordStageChange(actor, taskId, from, to): Promise<void>`
- `recordResponsibleChange(actor, taskId, from, to): Promise<void>`
- `recordTaskCompletion(actor, taskId): Promise<void>`
- `recordTaskArchiving(actor, taskId): Promise<void>`

Rules:

- Append-only.
- Event summary must be understandable by non-technical users.

## historyQueryService

- `getTaskHistory(taskId): Promise<HistoryEvent[]>`
- `getTaskHistoryByType(taskId, eventType): Promise<HistoryEvent[]>`
- `getTaskHistoryByActor(actorUserId): Promise<HistoryEvent[]>`
- `countTaskHistory(taskId): Promise<number>`

## auditService

- `logAudit(actorOrPartial, event): Promise<AuditLog>`
- `logDenied(actorOrPartial, event): Promise<AuditLog>`
- `logFailed(actorOrPartial, event): Promise<AuditLog>`
- `logLoginAttempt(email, success): Promise<void>`
- `getAuditLogs(actor, filters): Promise<AuditLog[]>`

Rules:

- Append-only.
- Include requestId for correlation.
- Must not expose sensitive metadata to unauthorized readers.

## commentService

- `createComment(actor, taskId, input): Promise<Comment>`
- `getTaskComments(taskId): Promise<Comment[]>`
- `getUserComments(userId): Promise<Comment[]>`
- `getCommentsMentioningUser(userId): Promise<Comment[]>`
- `deleteComment(actor, taskId, commentId): Promise<void>`
- `countTaskComments(taskId): Promise<number>`
- `extractMentions(body): string[]`

Side effects:

- history event
- audit log
- mention alerts for mentioned users with access to the task

## attachmentService

- `uploadAttachment(actor, taskId, file): Promise<Attachment>`
- `getAttachment(actor, taskId, attachmentId): Promise<Attachment>`
- `getTaskAttachments(taskId): Promise<Attachment[]>`
- `getDownloadUrl(actor, taskId, attachmentId): Promise<string>`
- `deleteAttachment(actor, taskId, attachmentId): Promise<void>`
- `countTaskAttachments(taskId): Promise<number>`

Rules:

- Actor must have task access.
- Storage path must be task-scoped.
- Uses Vercel Blob for file storage.

## notificationService

- `createAlert(event): Promise<Alert[]>`
- `getUserAlerts(userId, filters): Promise<Alert[]>`
- `getUserUnreadAlerts(userId): Promise<Alert[]>`
- `markAlertAsRead(userId, alertId): Promise<void>`
- `markAllAlertsAsRead(userId): Promise<void>`
- `countUnreadAlerts(userId): Promise<number>`
- `deleteOldAlerts(before): Promise<void>`

Rules:

- Internal alert is always the source of truth.
- Deduplicate by `dedupeKey`.
- E-mail failure must update email status without deleting alert.

## emailQueueService

- `queueEmail(alert, recipient): Promise<EmailJob>`
- `getPendingEmails(): Promise<EmailJob[]>`
- `updateEmailJobStatus(jobId, status, error?): Promise<void>`
- `processPendingEmails(max?): Promise<void>`
- `processAllPendingEmails(): Promise<void>`
- `cleanupOldEmailJobs(before): Promise<void>`

## dueDateService

- `getUpcomingDueTasks(now, thresholdDays?): Promise<Task[]>`
- `getOverdueTasks(now): Promise<Task[]>`
- `alertUpcomingDueTasks(now): Promise<void>`
- `alertOverdueTasks(now): Promise<void>`
- `runDueDateCheck(now): Promise<void>`

Rules:

- Generate alerts only when due status changes or configured threshold is met.
- Do not spam repeated reminders for same recipient/task/status.

## alertConfigService

- `getAlertConfig(stageId, eventType): Promise<StageAlertConfig | null>`
- `getAllAlertConfigs(): Promise<StageAlertConfig[]>`
- `getAlertConfigsByStage(stageId): Promise<StageAlertConfig[]>`
- `updateAlertConfig(configId, patch): Promise<void>`
- `createDefaultAlertConfig(stageId, eventType): Promise<StageAlertConfig>`
- `seedDefaultAlertConfigs(): Promise<void>`
- `getRecipientsForEvent(event, task): Promise<User[]>`

## categoryService

- `getAllCategories(): Promise<TaskCategory[]>`
- `getActiveCategories(): Promise<TaskCategory[]>`
- `createCategory(data): Promise<TaskCategory>`
- `updateCategory(categoryId, patch): Promise<void>`
- `deleteCategory(categoryId): Promise<void>`

## attachmentEventService (archive-events)

- `onTaskArchived(actor, taskId): Promise<void>`
- `onTaskRestored(actor, taskId, reason): Promise<void>`

Both write history, audit, and emit alerts.
