# Internal Route Handler Contracts

All routes are private unless explicitly marked public. All private handlers
must verify authentication, load the internal user profile, enforce RBAC, call a
domain service, and return structured errors.

## Error Shape

```json
{
  "error": "Authentication required"
}
```

Common status mapping:

- `401`: unauthenticated
- `403`: authenticated but not authorized
- `404`: resource not visible or not found
- `409`: invalid workflow transition or conflicting state
- `422`: invalid input

## Auth

### POST /api/auth/session

Purpose: exchange/confirm Firebase identity for an application session/profile.

Request expects `Authorization: Bearer <firebase-id-token>` header.

Response:

```json
{
  "user": {
    "id": "user_123",
    "displayName": "Name",
    "email": "user@example.org",
    "role": "coordinator",
    "permissions": ["task:create"]
  }
}
```

## Tasks

### GET /api/tasks

Query:

- `stageId`
- `responsibleUserId`
- `priority`
- `dueStatus`
- `category`
- `archived`
- `q`

Response:

```json
{
  "tasks": [
    {
      "id": "task_123",
      "referenceCode": "JUR-2026-001",
      "title": "Analisar documento",
      "stageId": "entrada",
      "priority": "normal",
      "responsibleUserId": "user_123",
      "dueDate": "2026-06-25T12:00:00.000Z",
      "archived": false
    }
  ]
}
```

### POST /api/tasks

Creates a legal task.

Request:

```json
{
  "title": "Analisar documento",
  "description": "Descrição operacional",
  "category": "documentos",
  "priority": "normal",
  "responsibleUserId": "user_123",
  "participantIds": ["user_456"],
  "dueDate": "2026-06-25T12:00:00.000Z",
  "confidentialityLevel": "interno",
  "internalNotes": "Observação interna"
}
```

Response: `201` with task summary.

Side effects:

- task created
- history event `created`
- audit log
- internal/e-mail alerts as configured

### GET /api/tasks/{taskId}

Returns full task detail visible to the current user, including metadata and
history events.

### PATCH /api/tasks/{taskId}

Updates editable task fields, excluding stage/archive transitions.

Side effects:

- history event `edited`
- audit log
- alerts when responsible user changes

### POST /api/tasks/{taskId}/transitions

Request:

```json
{
  "targetStageId": "em-analise",
  "comment": "Motivo quando exigido"
}
```

Response:

```json
{
  "taskId": "task_123",
  "stageId": "em-analise",
  "historyId": "history_123"
}
```

Side effects:

- workflow validation
- task stage update
- history event
- audit log (including logDenied for denied transitions)
- alerts for stage change or backward transition

### POST /api/tasks/{taskId}/archive

Archives a completed or administratively closed task.

### POST /api/tasks/{taskId}/restore

Restores an archived task to an allowed non-archived state. Administrator or
authorized coordinator only.

## Comments

### GET /api/tasks/{taskId}/comments

Returns comments visible to the current user.

### POST /api/tasks/{taskId}/comments

Request:

```json
{
  "body": "Comentário interno com @menção",
  "mentionedUserIds": ["user_456"]
}
```

Side effects:

- comment created
- history event `comment_added`
- audit log
- mention alerts

## Attachments

### POST /api/tasks/{taskId}/attachments

Uploads a file and registers attachment metadata in a single step.

Request: multipart form with file field.

Response:

```json
{
  "attachmentId": "attachment_123",
  "fileName": "documento.pdf",
  "sizeBytes": 123456,
  "storagePath": "tasks/task_123/attachments/attachment_123/documento.pdf"
}
```

### GET /api/tasks/{taskId}/attachments/{attachmentId}

Returns attachment metadata and a temporary download URL.

## Alerts

### GET /api/alerts

Returns current user's alerts, with optional `unreadOnly=true`, `offset`, `limit`.

### POST /api/alerts/{alertId}/read

Marks an alert as read for the current recipient.

### PUT /api/alerts

Marks all alerts as read for the current user.

## Admin

### GET /api/admin/users

Lists users with optional search and role filter.

### POST /api/admin/users

Creates a new user (Firebase Auth + Firestore profile).

### GET/PATCH /api/admin/users/{userId}

Reads or updates a user's role, status, and permissions.

### POST /api/admin/users/{userId}/reset-password

Generates a Firebase password reset link.

### GET/PATCH /api/admin/alert-config

Reads or updates alert configuration per stage and event type.

### GET/POST /api/admin/categories

Lists or creates task categories.

### PATCH/DELETE /api/admin/categories/{categoryId}

Updates or deletes a task category.

### GET/POST /api/admin/email-jobs

Reads pending email jobs or triggers processing.

### GET/POST /api/cron/due-date-check

Protected by CRON_SECRET. Scans and generates alerts for upcoming/overdue tasks.

### GET/POST /api/cron/process-emails

Protected by CRON_SECRET. Processes pending email queue.

### POST /api/cron/cleanup

Protected by CRON_SECRET. Cleans up old alerts and email jobs.
